#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const provider = args.provider || "openai";
const model = args.model || (provider === "deepseek" ? "deepseek-chat" : "gpt-5.4-mini");
const casePath = args.case || "tests/api-ab-case.zh.json";
const runs = Number(args.runs || 1);
const order = args.order || "AB";
const outPath = args.out || `tests/api-ab-result-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
const temperature = args.temperature === undefined ? 0 : Number(args.temperature);
const maxOutputTokens = Number(args.max_output_tokens || 700);
const reasoningEffort = args.reasoning_effort || "low";

if (!["openai", "deepseek"].includes(provider)) {
  fail(`Unsupported provider: ${provider}`);
}

if (!["AB", "BA"].includes(order)) {
  fail("--order must be AB or BA");
}

if (!Number.isInteger(runs) || runs < 1) {
  fail("--runs must be a positive integer");
}

const apiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  fail(`Missing ${provider === "openai" ? "OPENAI_API_KEY" : "DEEPSEEK_API_KEY"}`);
}

const testCase = JSON.parse(await fs.readFile(casePath, "utf8"));
const caseDir = path.dirname(path.resolve(casePath));
const sharedEvidence = await loadSharedEvidence(testCase, caseDir);
const variants = buildVariants(testCase, sharedEvidence);
const runOrder = order.split("");
const records = [];

for (let runIndex = 0; runIndex < runs; runIndex += 1) {
  for (const key of runOrder) {
    const variant = variants[key];
    const record = await runVariant({
      provider,
      model,
      apiKey,
      testCase,
      variant,
      runIndex,
      temperature,
      maxOutputTokens,
      reasoningEffort,
    });
    records.push(record);
    process.stderr.write(`${record.variant_id} run ${runIndex + 1}: ${record.usage.provider_total_tokens ?? "unknown"} provider tokens\n`);
  }
}

const result = summarize({
  provider,
  model,
  testCase,
  records,
  runs,
  order,
  temperature,
  maxOutputTokens,
  reasoningEffort,
});

await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${outPath}\n`);

async function runVariant(options) {
  const started = performance.now();
  const response = options.provider === "openai"
    ? await callOpenAI(options)
    : await callDeepSeek(options);
  const wallTimeSec = Number(((performance.now() - started) / 1000).toFixed(3));
  const usage = normalizeUsage(options.provider, response.rawUsage);
  const outputText = response.outputText || "";
  const quality = scoreOutput(outputText, options.testCase.quality_rubric);

  return {
    run_id: `${options.testCase.task_id || "api-ab"}-${options.variant.id.toLowerCase()}-${options.runIndex + 1}`,
    task_id: options.testCase.task_id || null,
    provider: options.provider,
    model: options.model,
    reasoning_effort: options.reasoningEffort,
    temperature: options.temperature,
    max_output_tokens: options.maxOutputTokens,
    variant_id: options.variant.id,
    variant_name: options.variant.name,
    prompt_chars: options.variant.prompt.length,
    wall_time_sec: wallTimeSec,
    usage,
    quality,
    total_cost_proxy: estimateCostProxy(usage),
    output_text: outputText,
    raw_usage: response.rawUsage || null,
  };
}

async function callOpenAI({ apiKey, model, variant, temperature, maxOutputTokens, reasoningEffort }) {
  const body = {
    model,
    input: [
      {
        role: "system",
        content: variant.system,
      },
      {
        role: "user",
        content: variant.prompt,
      },
    ],
    max_output_tokens: maxOutputTokens,
  };

  if (Number.isFinite(temperature)) {
    body.temperature = temperature;
  }

  if (reasoningEffort !== "none") {
    body.reasoning = { effort: reasoningEffort };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    fail(`OpenAI API error ${response.status}: ${JSON.stringify(json)}`);
  }

  return {
    outputText: extractOpenAIText(json),
    rawUsage: json.usage,
  };
}

async function callDeepSeek({ apiKey, model, variant, temperature, maxOutputTokens }) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: variant.system },
        { role: "user", content: variant.prompt },
      ],
      temperature,
      max_tokens: maxOutputTokens,
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    fail(`DeepSeek API error ${response.status}: ${JSON.stringify(json)}`);
  }

  return {
    outputText: json.choices?.[0]?.message?.content || "",
    rawUsage: json.usage,
  };
}

async function loadSharedEvidence(testCase, caseDir) {
  const parts = [];
  for (const file of testCase.input_files || []) {
    const filePath = path.isAbsolute(file.path) ? file.path : path.resolve(caseDir, file.path);
    const content = await fs.readFile(filePath, "utf8");
    parts.push(`FILE: ${file.label || file.path}\nPATH: ${file.path}\n---\n${content}\n---`);
  }
  return parts.join("\n\n");
}

function buildVariants(testCase, sharedEvidence) {
  const system = testCase.static_prefix || "You are a precise evaluator. Follow the user's constraints.";
  const evidenceBlock = `Shared evidence for both variants:\n\n${sharedEvidence}`;
  return {
    A: {
      id: "A",
      name: "original_prompt",
      system,
      prompt: `${evidenceBlock}\n\n${testCase.variants.A}`,
    },
    B: {
      id: "B",
      name: "machine_task_packet",
      system,
      prompt: `${evidenceBlock}\n\n${testCase.variants.B}`,
    },
  };
}

function normalizeUsage(provider, usage = {}) {
  if (provider === "openai") {
    return {
      input_tokens: numberOrNull(usage.input_tokens),
      cached_tokens: numberOrNull(usage.input_tokens_details?.cached_tokens),
      output_tokens: numberOrNull(usage.output_tokens),
      reasoning_tokens: numberOrNull(usage.output_tokens_details?.reasoning_tokens),
      provider_total_tokens: numberOrNull(usage.total_tokens),
      prompt_cache_hit_tokens: null,
      prompt_cache_miss_tokens: null,
      unavailable_fields: unavailable({
        input_tokens: usage.input_tokens,
        cached_tokens: usage.input_tokens_details?.cached_tokens,
        output_tokens: usage.output_tokens,
        reasoning_tokens: usage.output_tokens_details?.reasoning_tokens,
      }),
      note: "OpenAI may include reasoning tokens inside output_tokens/provider total; use raw_usage for audit before applying price math.",
    };
  }

  return {
    input_tokens: numberOrNull(usage.prompt_tokens),
    cached_tokens: numberOrNull(usage.prompt_cache_hit_tokens),
    output_tokens: numberOrNull(usage.completion_tokens),
    reasoning_tokens: numberOrNull(usage.completion_tokens_details?.reasoning_tokens),
    provider_total_tokens: numberOrNull(usage.total_tokens),
    prompt_cache_hit_tokens: numberOrNull(usage.prompt_cache_hit_tokens),
    prompt_cache_miss_tokens: numberOrNull(usage.prompt_cache_miss_tokens),
    unavailable_fields: unavailable({
      input_tokens: usage.prompt_tokens,
      cached_tokens: usage.prompt_cache_hit_tokens,
      output_tokens: usage.completion_tokens,
      reasoning_tokens: usage.completion_tokens_details?.reasoning_tokens,
      prompt_cache_hit_tokens: usage.prompt_cache_hit_tokens,
      prompt_cache_miss_tokens: usage.prompt_cache_miss_tokens,
    }),
    note: "DeepSeek cache fields are provider-specific; reasoning_tokens may be unavailable on non-reasoner models.",
  };
}

function scoreOutput(outputText, rubric = {}) {
  const text = outputText.trim();
  const pointCount = countLikelyPoints(text);
  const hasIssueWhyFix = /Issue|问题/.test(text) && /Why|为什么|重要/.test(text) && /Fix|修改|办法|最小/.test(text);
  const hasExtraTail = /总结|总之|另外|额外/.test(text);
  const formatScore =
    (pointCount === 3 ? 2 : 0) +
    (hasIssueWhyFix ? 2 : 0) +
    (text.length <= (rubric.max_chars || 900) ? 2 : 0) +
    (!hasExtraTail ? 2 : 0);

  return {
    quality_score: null,
    quality_source: "manual_required",
    format_score_0_to_8: formatScore,
    task_passed: null,
    quality_dimensions: {
      exactly_three_points: pointCount === 3,
      issue_why_fix_shape: hasIssueWhyFix,
      concise: text.length <= (rubric.max_chars || 900),
      no_extra_summary_detected: !hasExtraTail,
    },
    note: "quality_score is intentionally separate from token saving and must be filled by the same reviewer using the rubric.",
  };
}

function summarize({ provider, model, testCase, records, runs, order, temperature, maxOutputTokens, reasoningEffort }) {
  const byVariant = groupBy(records, (record) => record.variant_id);
  const variantSummaries = {};
  for (const [variantId, variantRecords] of Object.entries(byVariant)) {
    variantSummaries[variantId] = {
      runs: variantRecords.length,
      avg_usage: averageUsage(variantRecords),
      avg_total_cost_proxy: averageCostProxy(variantRecords),
      quality_scores: variantRecords.map((record) => record.quality.quality_score),
      format_scores_0_to_8: variantRecords.map((record) => record.quality.format_score_0_to_8),
    };
  }

  const aCost = variantSummaries.A?.avg_total_cost_proxy?.unpriced_weighted_units ?? null;
  const bCost = variantSummaries.B?.avg_total_cost_proxy?.unpriced_weighted_units ?? null;
  const tokenSavingRatio = aCost && bCost !== null ? Number(((aCost - bCost) / aCost).toFixed(4)) : null;

  return {
    schema_version: "api-ab-result.v1",
    task_id: testCase.task_id || null,
    provider,
    model,
    fixed_conditions: {
      runs,
      order,
      temperature,
      max_output_tokens: maxOutputTokens,
      reasoning_effort: reasoningEffort,
      input_files: testCase.input_files || [],
    },
    important_assumptions: [
      "A and B receive identical shared evidence before their variant-specific instructions.",
      "Task packets may increase input_tokens; the pass rule uses total cost proxy and quality separately.",
      "cached_tokens are recorded separately because they affect price differently from uncached input.",
      "quality_score is not inferred from token usage.",
    ],
    variant_summaries: variantSummaries,
    token_saving_ratio: tokenSavingRatio,
    pass_rule: {
      required_token_saving_ratio: 0.25,
      required_quality_delta_min: -1,
      required_task_passed: true,
      retry_rule: "B retries must be <= A retries when retries are measured.",
      current_verdict: "pending_manual_quality_score",
    },
    records,
  };
}

function estimateCostProxy(usage) {
  const input = usage.input_tokens ?? 0;
  const cached = usage.cached_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const reasoning = usage.reasoning_tokens ?? 0;
  const uncachedInput = Math.max(input - cached, 0);

  return {
    uncached_input_tokens: uncachedInput,
    cached_tokens: cached,
    output_tokens: output,
    reasoning_tokens: reasoning,
    provider_total_tokens: usage.provider_total_tokens,
    unpriced_weighted_units: uncachedInput + cached + output,
    protocol_total_tokens: input + output + reasoning,
    note: "Use provider pricing for final money cost. Do not double-charge reasoning if provider output_tokens already includes it.",
  };
}

function averageUsage(records) {
  const fields = [
    "input_tokens",
    "cached_tokens",
    "output_tokens",
    "reasoning_tokens",
    "provider_total_tokens",
    "prompt_cache_hit_tokens",
    "prompt_cache_miss_tokens",
  ];
  const output = {};
  for (const field of fields) {
    output[field] = average(records.map((record) => record.usage[field]).filter((value) => value !== null));
  }
  return output;
}

function averageCostProxy(records) {
  const fields = [
    "uncached_input_tokens",
    "cached_tokens",
    "output_tokens",
    "reasoning_tokens",
    "provider_total_tokens",
    "unpriced_weighted_units",
    "protocol_total_tokens",
  ];
  const output = {};
  for (const field of fields) {
    output[field] = average(records.map((record) => record.total_cost_proxy[field]).filter((value) => value !== null));
  }
  output.note = "Apply provider prices for final money cost; this average keeps quality and token saving separate.";
  return output;
}

function average(values) {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] ||= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function countLikelyPoints(text) {
  const numbered = text.match(/(^|\n)\s*(\d+\.|[-*]\s+)/g);
  if (numbered) return numbered.length;
  const issueMatches = text.match(/Issue|问题/g);
  return issueMatches ? issueMatches.length : 0;
}

function extractOpenAIText(json) {
  if (typeof json.output_text === "string") return json.output_text;
  const chunks = [];
  for (const item of json.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n");
}

function unavailable(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null)
    .map(([key]) => key);
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--help" || item === "-h") {
      parsed.help = true;
    } else if (item.startsWith("--")) {
      const key = item.slice(2).replaceAll("-", "_");
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        parsed[key] = true;
      } else {
        parsed[key] = next;
        i += 1;
      }
    }
  }
  return parsed;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/run-api-ab-test.mjs --provider openai --model gpt-5.4-mini --case tests/api-ab-case.zh.json --runs 3 --order AB --out tests/results/openai-ab.json

Environment:
  OPENAI_API_KEY      Required for --provider openai
  DEEPSEEK_API_KEY    Required for --provider deepseek

Notes:
  - The script records usage fields and leaves quality_score for manual scoring.
  - Use --order AB and --order BA in separate runs to detect cache/order bias.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
