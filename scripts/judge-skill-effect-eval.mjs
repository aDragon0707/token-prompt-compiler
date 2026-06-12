#!/usr/bin/env node

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const envLoad = loadLocalEnv(args.env_file);

if (args.help) {
  printHelp();
  process.exit(0);
}

const inputPaths = parseList(args.input);
if (!inputPaths.length) {
  fail("--input is required");
}

const execute = Boolean(args.execute);
if (args.dry_run && execute) {
  fail("Use either --dry-run or --execute, not both");
}

const provider = args.provider || "tokendance";
const model = args.model || defaultModel(provider);
const baseUrl = normalizeBaseUrl(args.base_url || defaultBaseUrl(provider));
const temperature = args.temperature === undefined ? 0 : Number(args.temperature);
const maxTokens = Number(args.max_tokens || 2000);
const concurrency = Number(args.concurrency || 3);
const limit = args.limit === undefined ? null : Number(args.limit);
const jsonMode = args.no_json_mode ? false : true;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const rawOutPath = args.raw_out || `eval-runs/skill-effect-judge-${timestamp}.json`;
const summaryOutPath = args.out || args.summary_out || `evals/results/skill-effect-judge-${timestamp}.summary.json`;
const markdownOutPath = args.markdown_out || summaryOutPath.replace(/\.json$/i, ".md");

if (!["stepfun", "tokendance", "openai-compatible"].includes(provider)) {
  fail(`Unsupported provider: ${provider}`);
}

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 12) {
  fail("--concurrency must be an integer from 1 to 12");
}

if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
  fail("--limit must be a positive integer");
}

const rubric = await readJson("evals/rubrics/skill-effect-rubric.json");
const rawInputs = [];
for (const inputPath of inputPaths) {
  const raw = await readJson(inputPath);
  if (raw.schema_version !== "skill-effect-raw.v1") {
    fail(`${inputPath} must use schema_version skill-effect-raw.v1`);
  }
  rawInputs.push({ path: inputPath, raw });
}

let records = rawInputs.flatMap(({ path: inputPath, raw }) =>
  (raw.records || []).map((record) => ({
    input_path: inputPath,
    source_provider: raw.provider,
    source_base_url: raw.base_url,
    source_models: raw.models,
    ...record,
  })),
);

if (limit !== null) {
  records = records.slice(0, limit);
}

const plannedJudgeCalls = records.filter((record) => record.status === "ok").length;

if (!execute) {
  writeJson({
    mode: "dry-run",
    execute: false,
    input_paths: inputPaths,
    input_file_count: inputPaths.length,
    source_record_count: records.length,
    planned_judge_calls: plannedJudgeCalls,
    provider,
    model,
    base_url: baseUrl,
    endpoint: `${baseUrl}/chat/completions`,
    concurrency,
    json_mode: jsonMode,
    raw_out_path: rawOutPath,
    summary_out_path: summaryOutPath,
    markdown_out_path: markdownOutPath,
    env_file_loaded: envLoad.loaded,
    env_file_keys: envLoad.keys,
    rubric_dimensions: Object.keys(rubric.dimensions || {}),
    sample_record: records[0] ? previewRecord(records[0]) : null,
    claim_boundary: "Dry-run plans judge scoring only. It does not call provider APIs or prove token savings.",
  });
  process.exit(0);
}

const apiKey = process.env[apiKeyEnv(provider)];
if (!apiKey) {
  fail(`Missing ${apiKeyEnv(provider)}`);
}

const judgedRecords = await mapWithConcurrency(records, concurrency, async (record, index) => {
  const judged = record.status === "ok"
    ? await judgeOne({ record, rubric, provider, baseUrl, apiKey, model, temperature, maxTokens })
    : judgeProviderFailure(record, rubric);
  process.stderr.write(`${index + 1}/${records.length} ${record.run_id}: ${judged.judge_status}\n`);
  return judged;
});

const rawJudge = {
  schema_version: "skill-effect-judge-raw.v1",
  generated_at: new Date().toISOString(),
  input_paths: inputPaths,
  judge_provider: provider,
  judge_base_url: baseUrl,
  judge_model: model,
  judge_temperature: temperature,
  source_record_count: records.length,
  planned_judge_calls: plannedJudgeCalls,
  records: judgedRecords,
  claim_boundary: "Judge scores behavior and output quality only. It is not token-saving proof.",
};

const summary = summarize(rawJudge, rubric);
const markdown = renderMarkdown(summary);

await fs.mkdir(path.dirname(path.resolve(repoRoot, rawOutPath)), { recursive: true });
await fs.writeFile(path.resolve(repoRoot, rawOutPath), `${JSON.stringify(rawJudge, null, 2)}\n`, "utf8");

await fs.mkdir(path.dirname(path.resolve(repoRoot, summaryOutPath)), { recursive: true });
await fs.writeFile(path.resolve(repoRoot, summaryOutPath), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await fs.writeFile(path.resolve(repoRoot, markdownOutPath), `${markdown}\n`, "utf8");

writeJson({
  mode: "execute",
  execute: true,
  raw_out_path: rawOutPath,
  summary_out_path: summaryOutPath,
  markdown_out_path: markdownOutPath,
  records: judgedRecords.length,
  summary: summary.metrics,
});

async function judgeOne({ record, rubric: judgeRubric, provider: providerId, baseUrl: providerBaseUrl, apiKey: providerApiKey, model: judgeModel, temperature: temp, maxTokens: maxOutputTokens }) {
  const started = performance.now();
  const prompt = buildJudgePrompt(record, judgeRubric);
  const body = {
    model: judgeModel,
    messages: [
      {
        role: "system",
        content: [
          "You are a strict evaluator for an AI skill benchmark.",
          "Return one compact JSON object only.",
          "The first character must be { and the last character must be }.",
          "Do not explain, do not use markdown, do not think step by step in the answer.",
        ].join(" "),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: temp,
    max_tokens: maxOutputTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  let response;
  let json;
  try {
    response = await fetch(`${providerBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    json = await response.json();
  } catch (error) {
    return {
      ...baseJudgeRecord(record),
      judge_status: "transport_error",
      judge_error_type: error.name || "transport_error",
      judge_error_message: sanitizeProviderError(error.message),
      judge_wall_time_sec: Number(((performance.now() - started) / 1000).toFixed(3)),
      score: zeroScore(judgeRubric, "judge_transport_error"),
    };
  }

  const message = json?.choices?.[0]?.message || {};
  const content = extractMessageText(message);
  const parsed = parseJudgeJson(content);
  const normalizedScore = parsed
    ? normalizeJudgeScore(parsed, judgeRubric)
    : zeroScore(judgeRubric, "judge_parse_error");

  return {
    ...baseJudgeRecord(record),
    judge_status: response.ok && parsed ? "ok" : response.ok ? "parse_error" : "provider_error",
    judge_error_type: response.ok ? null : json?.error?.type || json?.error?.code || "provider_error",
    judge_error_message: response.ok ? null : sanitizeProviderError(json?.error?.message || json?.message || ""),
    judge_wall_time_sec: Number(((performance.now() - started) / 1000).toFixed(3)),
    judge_usage: normalizeUsage(json?.usage),
    judge_message_field_names: Object.keys(message).sort(),
    judge_output_excerpt: truncate(content, 1000),
    score: normalizedScore,
  };
}

function buildJudgePrompt(record, judgeRubric) {
  return JSON.stringify({
    task: "Grade this candidate output for the token-prompt-compiler skill-effect eval.",
    output_schema: {
      dimension_scores: {
        trigger_correctness: "number",
        boundary_following: "number",
        reference_routing: "number",
        claim_safety: "number",
        prompt_quality: "number",
        over_packet_penalty: "number",
        output_usefulness: "number",
      },
      total_score: "number",
      task_passed: "boolean",
      trigger_passed: "boolean",
      boundary_passed: "boolean",
      reference_routing_passed: "boolean",
      claim_boundary_violated: "boolean",
      over_packet: "boolean",
      failure_types: "string[]",
      concise_reason: "string under 20 words",
    },
    score_contract: {
      score_range: judgeRubric.score_range,
      dimensions: judgeRubric.dimensions,
      failure_types: judgeRubric.failure_types,
    },
    record: {
      run_id: record.run_id,
      source_provider: record.source_provider || record.provider,
      model: record.model,
      case_id: record.case_id,
      variant_id: record.variant_id,
      variant_name: record.variant_name,
      reference_paths: record.reference_paths || [],
      expected_behavior: record.evaluator_metadata?.expected_behavior || [],
      must_not: record.evaluator_metadata?.must_not || [],
      expected_references: record.evaluator_metadata?.expected_references || [],
      pass_rule: record.evaluator_metadata?.pass_rule || "",
      output_text: truncate(record.output_text || "", 12000),
    },
    grading_rules: [
      "Do not reward long output by default.",
      "If output_text is empty or only hidden reasoning, score low and set task_passed=false.",
      "If the output makes unsupported token-saving or benchmark claims, set claim_boundary_violated=true.",
      "If the case expects a clarification and the output instead invents or executes a task, score low.",
      "If variant C includes reference context but the answer ignores required reference behavior, lower reference_routing.",
      "Return valid compact JSON only. No prose before or after JSON.",
    ],
  });
}

function normalizeJudgeScore(parsed, judgeRubric) {
  const dimensions = {};
  let total = 0;
  for (const [dimension, spec] of Object.entries(judgeRubric.dimensions || {})) {
    const max = Number(spec.points || 0);
    const raw = Number(parsed.dimension_scores?.[dimension] ?? 0);
    const score = clamp(Number.isFinite(raw) ? raw : 0, 0, max);
    dimensions[dimension] = Number(score.toFixed(3));
    total += score;
  }

  const parsedTotal = Number(parsed.total_score);
  const totalScore = Number((Number.isFinite(parsedTotal) ? clamp(parsedTotal, 0, 10) : clamp(total, 0, 10)).toFixed(3));
  const allowedFailureTypes = new Set(judgeRubric.failure_types || []);
  const failureTypes = Array.isArray(parsed.failure_types)
    ? parsed.failure_types.filter((type) => allowedFailureTypes.has(type))
    : [];

  return {
    dimension_scores: dimensions,
    total_score: totalScore,
    task_passed: Boolean(parsed.task_passed),
    trigger_passed: Boolean(parsed.trigger_passed),
    boundary_passed: Boolean(parsed.boundary_passed),
    reference_routing_passed: Boolean(parsed.reference_routing_passed),
    claim_boundary_violated: Boolean(parsed.claim_boundary_violated),
    over_packet: Boolean(parsed.over_packet),
    failure_types: failureTypes,
    concise_reason: truncate(String(parsed.concise_reason || ""), 240),
  };
}

function zeroScore(judgeRubric, failureType) {
  const dimensionScores = {};
  for (const dimension of Object.keys(judgeRubric.dimensions || {})) {
    dimensionScores[dimension] = 0;
  }
  return {
    dimension_scores: dimensionScores,
    total_score: 0,
    task_passed: false,
    trigger_passed: false,
    boundary_passed: false,
    reference_routing_passed: false,
    claim_boundary_violated: false,
    over_packet: false,
    failure_types: [failureType],
    concise_reason: failureType,
  };
}

function judgeProviderFailure(record, judgeRubric) {
  return {
    ...baseJudgeRecord(record),
    judge_status: "source_provider_error",
    judge_error_type: record.error_type || record.status,
    judge_error_message: sanitizeProviderError(record.error_message || ""),
    judge_wall_time_sec: 0,
    judge_usage: normalizeUsage(null),
    score: zeroScore(judgeRubric, "provider_error"),
  };
}

function baseJudgeRecord(record) {
  return {
    input_path: record.input_path,
    source_provider: record.source_provider || record.provider,
    source_model: record.model,
    run_id: record.run_id,
    case_id: record.case_id,
    variant_id: record.variant_id,
    variant_name: record.variant_name,
    source_status: record.status,
    source_usage: record.usage,
    source_latency_sec: record.wall_time_sec,
  };
}

function summarize(rawJudge, judgeRubric) {
  const records = rawJudge.records;
  const okJudges = records.filter((record) => record.judge_status === "ok");
  const byVariant = groupBy(records, (record) => record.variant_id);
  const byModel = groupBy(records, (record) => record.source_model);
  const byCase = groupBy(records, (record) => record.case_id);

  const variantSummaries = summarizeEntries(byVariant);
  const modelSummaries = summarizeEntries(byModel);
  const caseSummaries = summarizeEntries(byCase);

  return {
    schema_version: "skill-effect-judge-summary.v1",
    generated_at: rawJudge.generated_at,
    input_paths: rawJudge.input_paths,
    judge_provider: rawJudge.judge_provider,
    judge_model: rawJudge.judge_model,
    source_record_count: rawJudge.source_record_count,
    judged_record_count: records.length,
    metrics: summarizeGroup(records),
    variant_summaries: variantSummaries,
    model_summaries: modelSummaries,
    case_summaries: caseSummaries,
    deltas: {
      B_minus_A: delta(variantSummaries.B, variantSummaries.A),
      C_minus_B: delta(variantSummaries.C, variantSummaries.B),
      C_minus_A: delta(variantSummaries.C, variantSummaries.A),
    },
    model_ranking: Object.entries(modelSummaries)
      .map(([model, summary]) => ({ model, avg_total_score: summary.avg_total_score, task_pass_rate: summary.task_pass_rate, records: summary.records }))
      .sort((a, b) => (b.avg_total_score ?? -1) - (a.avg_total_score ?? -1)),
    record_scores: records.map((record) => ({
      run_id: record.run_id,
      source_model: record.source_model,
      case_id: record.case_id,
      variant_id: record.variant_id,
      judge_status: record.judge_status,
      total_score: record.score.total_score,
      task_passed: record.score.task_passed,
      failure_types: record.score.failure_types,
      concise_reason: record.score.concise_reason,
    })),
    rubric_dimensions: Object.keys(judgeRubric.dimensions || {}),
    claim_boundary: "Judge scores behavior and quality only. Token or cost claims require provider usage, quality review, AB/BA controls, and pass-rule analysis.",
    residual_risk: "This is one-shot model judging. Human audit of a 10-20% sample is required before strong quality claims.",
    judge_ok_rate: ratio(okJudges.length, records.length),
  };
}

function summarizeEntries(groups) {
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, summarizeGroup(values)]));
}

function summarizeGroup(records) {
  return {
    records: records.length,
    judge_ok_rate: ratio(records.filter((record) => record.judge_status === "ok").length, records.length),
    task_pass_rate: ratio(records.filter((record) => record.score.task_passed).length, records.length),
    trigger_pass_rate: ratio(records.filter((record) => record.score.trigger_passed).length, records.length),
    boundary_pass_rate: ratio(records.filter((record) => record.score.boundary_passed).length, records.length),
    reference_route_pass_rate: ratio(records.filter((record) => record.score.reference_routing_passed).length, records.length),
    claim_boundary_violation_rate: ratio(records.filter((record) => record.score.claim_boundary_violated).length, records.length),
    over_packet_rate: ratio(records.filter((record) => record.score.over_packet).length, records.length),
    avg_total_score: average(records.map((record) => record.score.total_score)),
    avg_source_input_tokens: average(records.map((record) => record.source_usage?.input_tokens).filter((value) => value !== null && value !== undefined)),
    avg_source_output_tokens: average(records.map((record) => record.source_usage?.output_tokens).filter((value) => value !== null && value !== undefined)),
    avg_source_total_tokens: average(records.map((record) => record.source_usage?.provider_total_tokens).filter((value) => value !== null && value !== undefined)),
    avg_source_latency_sec: average(records.map((record) => record.source_latency_sec).filter((value) => value !== null && value !== undefined)),
    avg_judge_latency_sec: average(records.map((record) => record.judge_wall_time_sec).filter((value) => value !== null && value !== undefined)),
    failure_types: countBy(records.flatMap((record) => record.score.failure_types || []), (type) => type),
  };
}

function delta(left, right) {
  if (!left || !right) return null;
  return {
    avg_total_score: diff(left.avg_total_score, right.avg_total_score),
    task_pass_rate: diff(left.task_pass_rate, right.task_pass_rate),
    claim_boundary_violation_rate: diff(left.claim_boundary_violation_rate, right.claim_boundary_violation_rate),
    over_packet_rate: diff(left.over_packet_rate, right.over_packet_rate),
    avg_source_total_tokens: diff(left.avg_source_total_tokens, right.avg_source_total_tokens),
  };
}

function renderMarkdown(summary) {
  const lines = [
    "# Skill Effect Judge Summary",
    "",
    "This report is one-shot model judging evidence. It is not token-saving proof and still requires human audit before strong quality claims.",
    "",
    "## Overall",
    "",
    `- Judge: ${summary.judge_provider} / ${summary.judge_model}`,
    `- Records judged: ${summary.judged_record_count}`,
    `- Average score: ${fmt(summary.metrics.avg_total_score)} / 10`,
    `- Task pass rate: ${fmtPct(summary.metrics.task_pass_rate)}`,
    `- Claim boundary violation rate: ${fmtPct(summary.metrics.claim_boundary_violation_rate)}`,
    `- Over-packet rate: ${fmtPct(summary.metrics.over_packet_rate)}`,
    "",
    "## Variant Summary",
    "",
    "| Variant | Records | Avg score | Task pass | Avg total tokens | Over-packet | Claim violations |",
    "|---|---:|---:|---:|---:|---:|---:|",
  ];

  for (const variantId of ["A", "B", "C"]) {
    const summaryForVariant = summary.variant_summaries[variantId];
    if (!summaryForVariant) continue;
    lines.push(`| ${variantId} | ${summaryForVariant.records} | ${fmt(summaryForVariant.avg_total_score)} | ${fmtPct(summaryForVariant.task_pass_rate)} | ${fmt(summaryForVariant.avg_source_total_tokens)} | ${fmtPct(summaryForVariant.over_packet_rate)} | ${fmtPct(summaryForVariant.claim_boundary_violation_rate)} |`);
  }

  lines.push(
    "",
    "## Deltas",
    "",
    `- B minus A avg score: ${fmt(summary.deltas.B_minus_A?.avg_total_score)}`,
    `- C minus B avg score: ${fmt(summary.deltas.C_minus_B?.avg_total_score)}`,
    `- C minus A avg score: ${fmt(summary.deltas.C_minus_A?.avg_total_score)}`,
    "",
    "## Model Ranking",
    "",
    "| Model | Records | Avg score | Task pass |",
    "|---|---:|---:|---:|",
  );

  for (const row of summary.model_ranking) {
    lines.push(`| ${row.model} | ${row.records} | ${fmt(row.avg_total_score)} | ${fmtPct(row.task_pass_rate)} |`);
  }

  lines.push(
    "",
    "## Claim Boundary",
    "",
    summary.claim_boundary,
    "",
    "## Residual Risk",
    "",
    summary.residual_risk,
  );

  return lines.join("\n");
}

function parseJudgeJson(content) {
  const text = String(content || "").trim();
  const candidates = [
    text,
    text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""),
  ];
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

function extractMessageText(message) {
  const candidates = [
    message?.content,
    message?.reasoning_content,
    message?.reasoning,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return "";
}

async function mapWithConcurrency(items, workerCount, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(workerCount, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function previewRecord(record) {
  return {
    run_id: record.run_id,
    source_provider: record.source_provider,
    model: record.model,
    case_id: record.case_id,
    variant_id: record.variant_id,
    output_chars: String(record.output_text || "").length,
    expected_behavior_count: record.evaluator_metadata?.expected_behavior?.length || 0,
    must_not_count: record.evaluator_metadata?.must_not?.length || 0,
  };
}

function normalizeUsage(usage = {}) {
  return {
    input_tokens: numberOrNull(usage?.prompt_tokens ?? usage?.input_tokens),
    cached_tokens: numberOrNull(usage?.prompt_cache_hit_tokens ?? usage?.input_tokens_details?.cached_tokens),
    output_tokens: numberOrNull(usage?.completion_tokens ?? usage?.output_tokens),
    reasoning_tokens: numberOrNull(usage?.completion_tokens_details?.reasoning_tokens ?? usage?.output_tokens_details?.reasoning_tokens),
    provider_total_tokens: numberOrNull(usage?.total_tokens),
    raw_usage_field_names: Object.keys(usage || {}).sort(),
  };
}

function loadLocalEnv(explicitPath) {
  const candidates = [
    explicitPath,
    path.join(repoRoot, ".env.local"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!fsSync.existsSync(resolved)) {
      continue;
    }

    const loadedKeys = [];
    const raw = fsSync.readFileSync(resolved, "utf8").replace(/^\uFEFF/, "");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        continue;
      }

      const key = match[1];
      const value = unquoteEnvValue(match[2].trim());
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
      loadedKeys.push(key);
    }

    return {
      loaded: true,
      path: resolved,
      keys: loadedKeys.sort(),
    };
  }

  return {
    loaded: false,
    keys: [],
  };
}

function unquoteEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(repoRoot, relativePath), "utf8");
}

async function readJson(relativePath) {
  const raw = await readText(relativePath);
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

function defaultModel(providerId) {
  if (providerId === "stepfun") return "step-3.7-flash";
  if (providerId === "tokendance") return "deepseek-v4-pro";
  return "model-id-required";
}

function defaultBaseUrl(providerId) {
  if (providerId === "stepfun") return process.env.STEPFUN_BASE_URL || "https://api.stepfun.com/v1";
  if (providerId === "tokendance") return process.env.TOKENDANCE_BASE_URL || "https://tokendance.space/gateway/v1";
  return process.env.OPENAI_COMPATIBLE_BASE_URL || "https://example.invalid/v1";
}

function apiKeyEnv(providerId) {
  if (providerId === "stepfun") return "STEPFUN_API_KEY";
  if (providerId === "tokendance") return "TOKENDANCE_API_KEY";
  return "OPENAI_COMPATIBLE_API_KEY";
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

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/g, "");
}

function sanitizeProviderError(message) {
  return String(message || "")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED_SECRET]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_SECRET]")
    .slice(0, 500);
}

function truncate(value, maxChars) {
  const text = String(value || "");
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n[TRUNCATED]` : text;
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function ratio(part, total) {
  if (!total) return null;
  return Number((part / total).toFixed(3));
}

function diff(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) return null;
  return Number((left - right).toFixed(3));
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

function fmt(value) {
  return value === null || value === undefined ? "n/a" : String(value);
}

function fmtPct(value) {
  return value === null || value === undefined ? "n/a" : `${Number((value * 100).toFixed(1))}%`;
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/judge-skill-effect-eval.mjs --dry-run --input eval-runs/frontier-tokendance-a.json
  node scripts/judge-skill-effect-eval.mjs --execute --input eval-runs/frontier-tokendance-a.json --provider tokendance --model deepseek-v4-pro --concurrency 3
  node scripts/judge-skill-effect-eval.mjs --execute --input eval-runs/frontier-tokendance-a.json --no-json-mode
  node scripts/judge-skill-effect-eval.mjs --execute --input eval-runs/a.json,eval-runs/b.json --out evals/results/frontier-judge.summary.json

Environment:
  STEPFUN_API_KEY
  STEPFUN_BASE_URL
  TOKENDANCE_API_KEY
  TOKENDANCE_BASE_URL
  OPENAI_COMPATIBLE_API_KEY
  OPENAI_COMPATIBLE_BASE_URL

Notes:
  Default mode is dry-run. Use --execute to call provider APIs.
  Raw judge records go to eval-runs/ by default. Public summaries go to evals/results/.
  Judge output scores behavior and quality only; it is not token-saving proof.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
