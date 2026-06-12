#!/usr/bin/env node

import process from "node:process";
import { performance } from "node:perf_hooks";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const provider = args.provider || "stepfun";
const model = args.model || defaultModel(provider);
const baseUrl = normalizeBaseUrl(args.base_url || defaultBaseUrl(provider));
const execute = Boolean(args.execute);

if (args.dry_run && execute) {
  fail("Use either --dry-run or --execute, not both");
}

if (!["stepfun", "tokendance", "openai-compatible"].includes(provider)) {
  fail(`Unsupported provider: ${provider}`);
}

if (!execute) {
  writeJson({
    mode: "dry-run",
    execute: false,
    provider,
    model,
    base_url: baseUrl,
    endpoint: `${baseUrl}/chat/completions`,
    api_key_env: apiKeyEnv(provider),
    prompt_chars: smokePrompt().length,
    note: "Dry-run does not call provider APIs and does not require API keys.",
  });
  process.exit(0);
}

const apiKey = process.env[apiKeyEnv(provider)];
if (!apiKey) {
  fail(`Missing ${apiKeyEnv(provider)}`);
}

const started = performance.now();
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages: [
      {
        role: "system",
        content: "You are a compatibility smoke tester. Reply with JSON only.",
      },
      {
        role: "user",
        content: smokePrompt(),
      },
    ],
    temperature: 0,
    max_tokens: Number(args.max_tokens || 80),
  }),
});

const wallTimeSec = Number(((performance.now() - started) / 1000).toFixed(3));
let json = null;
try {
  json = await response.json();
} catch (error) {
  fail(`Provider returned non-JSON response ${response.status}: ${error.message}`);
}

const content = json?.choices?.[0]?.message?.content || "";
writeJson({
  mode: "execute",
  execute: true,
  provider,
  model,
  base_url: baseUrl,
  endpoint: `${baseUrl}/chat/completions`,
  http_status: response.status,
  ok: response.ok,
  wall_time_sec: wallTimeSec,
  has_message_content: content.length > 0,
  output_excerpt: content.slice(0, 240),
  usage: normalizeUsage(json?.usage),
  usage_field_coverage: usageFieldCoverage(json?.usage),
  error_type: response.ok ? null : json?.error?.type || json?.error?.code || "provider_error",
  note: "API key is never included in this output.",
});

if (!response.ok) {
  process.exit(1);
}

function smokePrompt() {
  return "Return exactly this JSON object: {\"skill_eval_smoke\":\"ok\"}";
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

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/g, "");
}

function normalizeUsage(usage = {}) {
  return {
    input_tokens: numberOrNull(usage.prompt_tokens ?? usage.input_tokens),
    cached_tokens: numberOrNull(usage.prompt_cache_hit_tokens ?? usage.input_tokens_details?.cached_tokens),
    output_tokens: numberOrNull(usage.completion_tokens ?? usage.output_tokens),
    reasoning_tokens: numberOrNull(usage.completion_tokens_details?.reasoning_tokens ?? usage.output_tokens_details?.reasoning_tokens),
    provider_total_tokens: numberOrNull(usage.total_tokens),
    raw_usage_field_names: Object.keys(usage || {}).sort(),
    unavailable_fields: unavailable({
      input_tokens: usage.prompt_tokens ?? usage.input_tokens,
      output_tokens: usage.completion_tokens ?? usage.output_tokens,
      provider_total_tokens: usage.total_tokens,
    }),
  };
}

function usageFieldCoverage(usage = {}) {
  const required = [
    usage.prompt_tokens ?? usage.input_tokens,
    usage.completion_tokens ?? usage.output_tokens,
    usage.total_tokens,
  ];
  const present = required.filter((value) => value !== undefined && value !== null).length;
  return Number((present / required.length).toFixed(3));
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

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/provider-smoke.mjs --dry-run --provider stepfun --model step-3.5-flash
  node scripts/provider-smoke.mjs --execute --provider tokendance --model deepseek-chat --base-url https://tokendance.space/gateway/v1

Environment:
  STEPFUN_API_KEY
  TOKENDANCE_API_KEY
  TOKENDANCE_BASE_URL
  OPENAI_COMPATIBLE_API_KEY
  OPENAI_COMPATIBLE_BASE_URL

Notes:
  Default mode is dry-run. Use --execute to call provider APIs.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
