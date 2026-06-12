#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const provider = args.provider || "stepfun";
const models = parseList(args.models || args.model || defaultModel(provider));
const runs = Number(args.runs || 1);
const casePath = args.case || "tests/skill-trigger-cases.json";
const execute = Boolean(args.execute);
const baseUrl = normalizeBaseUrl(args.base_url || defaultBaseUrl(provider));
const maxTokens = Number(args.max_tokens || 700);
const temperature = args.temperature === undefined ? 0 : Number(args.temperature);
const budgetMin = Number(args.budget_min_rmb || 200);
const budgetMax = Number(args.budget_max_rmb || 300);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const rawOutPath = args.raw_out || `eval-runs/skill-effect-${timestamp}.json`;
const summaryOutPath = args.summary_out || `evals/results/skill-effect-${timestamp}.summary.json`;

if (args.dry_run && execute) {
  fail("Use either --dry-run or --execute, not both");
}

if (!["stepfun", "tokendance", "openai-compatible"].includes(provider)) {
  fail(`Unsupported provider: ${provider}`);
}

if (!Number.isInteger(runs) || runs < 1) {
  fail("--runs must be a positive integer");
}

if (!models.length) {
  fail("--models must include at least one model id");
}

const cases = await readJson(casePath);
if (!Array.isArray(cases)) {
  fail(`${casePath} must be a JSON array`);
}

const variants = await buildVariants();
const plannedCalls = cases.length * variants.length * models.length * runs;

if (!execute) {
  const sampleCase = cases.find((testCase) => (testCase.expected_references || []).length > 0) || cases[0];
  const sampleVariants = [];
  for (const variantTemplate of variants) {
    const variant = await materializeVariant(variantTemplate, sampleCase);
    sampleVariants.push({
      id: variant.id,
      name: variant.name,
      prompt_chars: variant.prompt.length,
      system_chars: variant.system.length,
      reference_paths: variant.reference_paths,
    });
  }

  writeJson({
    mode: "dry-run",
    execute: false,
    provider,
    base_url: baseUrl,
    models,
    model_count: models.length,
    runs,
    case_path: casePath,
    case_count: cases.length,
    variants: variants.map((variant) => variant.id),
    variant_count: variants.length,
    planned_calls: plannedCalls,
    estimated_budget_rmb: {
      min: budgetMin,
      max: budgetMax,
      note: "Budget is a planning guardrail only; dry-run does not estimate provider-specific prices.",
    },
    raw_out_path: rawOutPath,
    summary_out_path: summaryOutPath,
    sample_case_id: sampleCase.id,
    sample_variants: sampleVariants,
  });
  process.exit(0);
}

const apiKey = process.env[apiKeyEnv(provider)];
if (!apiKey) {
  fail(`Missing ${apiKeyEnv(provider)}`);
}

const records = [];
for (const model of models) {
  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    for (const testCase of cases) {
      for (const variantTemplate of variants) {
        const variant = await materializeVariant(variantTemplate, testCase);
        const record = await runOne({
          provider,
          baseUrl,
          apiKey,
          model,
          runIndex,
          testCase,
          variant,
          temperature,
          maxTokens,
        });
        records.push(record);
        process.stderr.write(`${model} ${testCase.id} ${variant.id} run ${runIndex + 1}: ${record.status}\n`);
      }
    }
  }
}

const raw = {
  schema_version: "skill-effect-raw.v1",
  generated_at: new Date().toISOString(),
  provider,
  base_url: baseUrl,
  case_path: casePath,
  models,
  runs,
  variants: variants.map(({ id, name }) => ({ id, name })),
  planned_calls: plannedCalls,
  records,
  claim_boundary: "Raw records show behavior and provider usage fields only; they are not token-saving proof.",
};

const summary = summarize(raw);

await fs.mkdir(path.dirname(path.resolve(repoRoot, rawOutPath)), { recursive: true });
await fs.writeFile(path.resolve(repoRoot, rawOutPath), `${JSON.stringify(raw, null, 2)}\n`, "utf8");

await fs.mkdir(path.dirname(path.resolve(repoRoot, summaryOutPath)), { recursive: true });
await fs.writeFile(path.resolve(repoRoot, summaryOutPath), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

writeJson({
  mode: "execute",
  execute: true,
  raw_out_path: rawOutPath,
  summary_out_path: summaryOutPath,
  records: records.length,
  summary: summary.metrics,
});

async function buildVariants() {
  const skill = await readText("SKILL.md");
  const skillCore = extractSkillEvalSections(skill);
  return [
    {
      id: "A",
      name: "no_skill_baseline",
      system: "You are a careful assistant. Follow the user's request exactly.",
      includeReferences: false,
    },
    {
      id: "B",
      name: "skill_loaded",
      system: `You are testing token-prompt-compiler behavior. Apply these skill instructions when relevant.\n\n${skillCore}`,
      includeReferences: false,
    },
    {
      id: "C",
      name: "skill_plus_routed_reference",
      system: `You are testing token-prompt-compiler behavior. Apply these skill instructions when relevant.\n\n${skillCore}`,
      includeReferences: true,
    },
  ];
}

async function materializeVariant(variant, testCase) {
  const referenceBlock = variant.includeReferences
    ? await buildReferenceBlock(testCase.expected_references || [])
    : "";

  const prompt = [
    `Case id: ${testCase.id}`,
    "User input:",
    testCase.input,
    "",
    "Expected behavior for evaluator reference:",
    (testCase.expected_behavior || []).map((item) => `- ${item}`).join("\n"),
    "",
    "Must not:",
    (testCase.must_not || []).map((item) => `- ${item}`).join("\n"),
    "",
    `Pass rule: ${testCase.pass_rule}`,
    referenceBlock,
  ].filter(Boolean).join("\n");

  return {
    ...variant,
    prompt,
    reference_paths: variant.includeReferences ? (testCase.expected_references || []) : [],
  };
}

async function buildReferenceBlock(referencePaths) {
  if (!referencePaths.length) {
    return "Routed references: none expected for this case.";
  }

  const parts = ["Routed references. Use only these reference files; do not assume other reference content."];
  for (const relativePath of referencePaths) {
    const text = await readText(relativePath);
    parts.push(`REFERENCE: ${relativePath}\n---\n${text}\n---`);
  }
  return parts.join("\n\n");
}

async function runOne({ provider: providerId, baseUrl: providerBaseUrl, apiKey, model, runIndex, testCase, variant, temperature: temp, maxTokens: maxOutputTokens }) {
  const started = performance.now();
  const body = {
    model,
    messages: [
      { role: "system", content: variant.system },
      { role: "user", content: variant.prompt },
    ],
    temperature: temp,
    max_tokens: maxOutputTokens,
  };

  let response;
  let json;
  try {
    response = await fetch(`${providerBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    json = await response.json();
  } catch (error) {
    return {
      run_id: `${model}-${testCase.id}-${variant.id}-${runIndex + 1}`,
      provider: providerId,
      model,
      case_id: testCase.id,
      variant_id: variant.id,
      variant_name: variant.name,
      run_index: runIndex + 1,
      status: "transport_error",
      error_type: error.name || "transport_error",
      error_message: error.message,
      wall_time_sec: Number(((performance.now() - started) / 1000).toFixed(3)),
      usage: normalizeUsage(null),
      output_text: "",
      output_excerpt: "",
      reference_paths: variant.reference_paths,
    };
  }

  const outputText = json?.choices?.[0]?.message?.content || "";
  return {
    run_id: `${model}-${testCase.id}-${variant.id}-${runIndex + 1}`,
    provider: providerId,
    model,
    case_id: testCase.id,
    variant_id: variant.id,
    variant_name: variant.name,
    run_index: runIndex + 1,
    status: response.ok ? "ok" : "provider_error",
    http_status: response.status,
    error_type: response.ok ? null : json?.error?.type || json?.error?.code || "provider_error",
    wall_time_sec: Number(((performance.now() - started) / 1000).toFixed(3)),
    usage: normalizeUsage(json?.usage),
    output_text: outputText,
    output_excerpt: outputText.slice(0, 500),
    reference_paths: variant.reference_paths,
  };
}

function summarize(raw) {
  const okRecords = raw.records.filter((record) => record.status === "ok");
  const byVariant = groupBy(raw.records, (record) => record.variant_id);
  const byModel = groupBy(raw.records, (record) => record.model);
  const variantSummaries = {};
  const modelSummaries = {};

  for (const [variantId, records] of Object.entries(byVariant)) {
    variantSummaries[variantId] = summarizeGroup(records);
  }

  for (const [model, records] of Object.entries(byModel)) {
    modelSummaries[model] = summarizeGroup(records);
  }

  return {
    schema_version: "skill-effect-summary.v1",
    generated_at: raw.generated_at,
    provider: raw.provider,
    base_url: raw.base_url,
    models: raw.models,
    case_path: raw.case_path,
    variants: raw.variants,
    planned_calls: raw.planned_calls,
    record_count: raw.records.length,
    metrics: {
      ok_rate: ratio(okRecords.length, raw.records.length),
      avg_latency_sec: average(okRecords.map((record) => record.wall_time_sec)),
      usage_field_coverage: average(raw.records.map((record) => usageFieldCoverage(record.usage))),
    },
    variant_summaries: variantSummaries,
    model_summaries: modelSummaries,
    claim_boundary: "This summary is trigger and behavior evidence only unless manual quality and provider-priced A/B cost review are added.",
  };
}

function summarizeGroup(records) {
  const ok = records.filter((record) => record.status === "ok");
  return {
    records: records.length,
    ok_rate: ratio(ok.length, records.length),
    avg_latency_sec: average(ok.map((record) => record.wall_time_sec)),
    avg_input_tokens: average(records.map((record) => record.usage.input_tokens).filter((value) => value !== null)),
    avg_output_tokens: average(records.map((record) => record.usage.output_tokens).filter((value) => value !== null)),
    avg_total_tokens: average(records.map((record) => record.usage.provider_total_tokens).filter((value) => value !== null)),
    usage_field_coverage: average(records.map((record) => usageFieldCoverage(record.usage))),
    error_types: countBy(records.filter((record) => record.status !== "ok"), (record) => record.error_type || record.status),
  };
}

function extractSkillEvalSections(skill) {
  const sections = [
    "## Core Rule",
    "## Intent Gate",
    "## Reference Router",
    "## Scale Gate",
    "## Prompt Quality Gate",
    "## A/B Test Mode",
  ];
  const parts = [];
  for (const heading of sections) {
    const start = skill.indexOf(`${heading}\n`);
    if (start === -1) {
      continue;
    }

    const bodyStart = start + heading.length + 1;
    const next = skill.slice(bodyStart).match(/\n## /);
    const bodyEnd = next ? bodyStart + next.index : skill.length;
    parts.push(`${heading}\n${skill.slice(bodyStart, bodyEnd).trim()}`);
  }
  return parts.join("\n\n");
}

function normalizeUsage(usage = {}) {
  return {
    input_tokens: numberOrNull(usage?.prompt_tokens ?? usage?.input_tokens),
    cached_tokens: numberOrNull(usage?.prompt_cache_hit_tokens ?? usage?.input_tokens_details?.cached_tokens),
    output_tokens: numberOrNull(usage?.completion_tokens ?? usage?.output_tokens),
    reasoning_tokens: numberOrNull(usage?.completion_tokens_details?.reasoning_tokens ?? usage?.output_tokens_details?.reasoning_tokens),
    provider_total_tokens: numberOrNull(usage?.total_tokens),
    raw_usage_field_names: Object.keys(usage || {}).sort(),
    unavailable_fields: unavailable({
      input_tokens: usage?.prompt_tokens ?? usage?.input_tokens,
      output_tokens: usage?.completion_tokens ?? usage?.output_tokens,
      provider_total_tokens: usage?.total_tokens,
    }),
  };
}

function usageFieldCoverage(usage) {
  const fields = ["input_tokens", "output_tokens", "provider_total_tokens"];
  const present = fields.filter((field) => usage?.[field] !== null && usage?.[field] !== undefined).length;
  return Number((present / fields.length).toFixed(3));
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(repoRoot, relativePath), "utf8");
}

async function readJson(relativePath) {
  const raw = await readText(relativePath);
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

function defaultModel(providerId) {
  if (providerId === "stepfun") return "step-3.5-flash";
  if (providerId === "tokendance") return "deepseek-chat";
  return "model-id-required";
}

function defaultBaseUrl(providerId) {
  if (providerId === "stepfun") return "https://api.stepfun.ai/v1";
  if (providerId === "tokendance") return process.env.TOKENDANCE_BASE_URL || "https://tokendance.space/gateway/v1";
  return process.env.OPENAI_COMPATIBLE_BASE_URL || "https://example.invalid/v1";
}

function apiKeyEnv(providerId) {
  if (providerId === "stepfun") return "STEPFUN_API_KEY";
  if (providerId === "tokendance") return "TOKENDANCE_API_KEY";
  return "OPENAI_COMPATIBLE_API_KEY";
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/g, "");
}

function unavailable(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null)
    .map(([key]) => key);
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function average(values) {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function ratio(part, total) {
  if (!total) return null;
  return Number((part / total).toFixed(3));
}

function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] ||= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
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

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/run-skill-effect-eval.mjs --dry-run --provider stepfun --models step-3.5-flash,step-3.7-flash --runs 2
  node scripts/run-skill-effect-eval.mjs --execute --provider tokendance --models deepseek-chat,qwen-plus --runs 2

Environment:
  STEPFUN_API_KEY
  TOKENDANCE_API_KEY
  TOKENDANCE_BASE_URL
  OPENAI_COMPATIBLE_API_KEY
  OPENAI_COMPATIBLE_BASE_URL

Notes:
  Default mode is dry-run. Use --execute to call provider APIs and write result files.
  Raw outputs go to eval-runs/ by default. Sanitized summaries go to evals/results/.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
