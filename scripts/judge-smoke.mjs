#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tpc-judge-smoke-"));
const fixturePath = path.join(tempDir, "skill-effect-raw.fixture.json");

const fixture = {
  schema_version: "skill-effect-raw.v1",
  generated_at: "2026-06-12T00:00:00.000Z",
  provider: "fixture",
  base_url: "https://example.invalid/v1",
  case_path: "tests/skill-trigger-cases.json",
  models: ["fixture-model"],
  runs: 1,
  variants: [
    { id: "A", name: "no_skill_baseline" },
    { id: "B", name: "skill_loaded" },
  ],
  planned_calls: 2,
  records: [
    makeRecord("fixture-model-bare-invocation-A-1", "bare-invocation", "A", "What task material, execution mode, and desired output should I use?"),
    makeRecord("fixture-model-benchmark-claim-B-1", "benchmark-claim", "B", "This is compatibility evidence only; it is not token-saving proof without provider usage and quality review."),
  ],
};

fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

const result = spawnSync(process.execPath, [
  "scripts/judge-skill-effect-eval.mjs",
  "--dry-run",
  "--input",
  fixturePath,
  "--provider",
  "tokendance",
  "--model",
  "deepseek-v4-pro",
  "--raw-out",
  "eval-runs/judge-smoke.raw.json",
  "--out",
  "evals/results/judge-smoke.summary.json",
], {
  cwd: repoRoot,
  encoding: "utf8",
  env: {
    ...process.env,
    STEPFUN_API_KEY: "",
    TOKENDANCE_API_KEY: "",
    OPENAI_COMPATIBLE_API_KEY: "",
  },
});

assert(result.status === 0, "judge dry-run exits 0");

let parsed = null;
try {
  parsed = JSON.parse(result.stdout);
  pass("judge dry-run stdout is JSON");
} catch {
  fail("judge dry-run stdout is JSON");
}

if (parsed) {
  assert(parsed.mode === "dry-run", "judge reports dry-run mode");
  assert(parsed.execute === false, "judge execute is false");
  assert(parsed.source_record_count === 2, "judge reads fixture records");
  assert(parsed.planned_judge_calls === 2, "judge plans two judge calls");
  assert(parsed.provider === "tokendance", "judge keeps provider id");
  assert(parsed.model === "deepseek-v4-pro", "judge keeps judge model");
  assert(parsed.raw_out_path === "eval-runs/judge-smoke.raw.json", "judge raw output stays in eval-runs/");
  assert(parsed.summary_out_path === "evals/results/judge-smoke.summary.json", "judge summary output stays in evals/results/");
  assert(parsed.markdown_out_path === "evals/results/judge-smoke.summary.md", "judge markdown output path is derived");
  assert(Array.isArray(parsed.rubric_dimensions), "judge reports rubric dimensions");
  assert(parsed.rubric_dimensions.includes("trigger_correctness"), "judge includes trigger_correctness dimension");
  assert(parsed.sample_record?.case_id === "bare-invocation", "judge previews first fixture case");
  assert(!JSON.stringify(parsed).includes("fixture secret"), "judge dry-run does not leak fixture secrets");
}

fs.rmSync(tempDir, { recursive: true, force: true });

if (process.exitCode) {
  process.exit();
}

console.log("judge smoke ok");

function makeRecord(runId, caseId, variantId, outputText) {
  return {
    run_id: runId,
    provider: "fixture",
    model: "fixture-model",
    case_id: caseId,
    variant_id: variantId,
    variant_name: variantId === "A" ? "no_skill_baseline" : "skill_loaded",
    run_index: 1,
    status: "ok",
    http_status: 200,
    error_type: null,
    error_message: null,
    wall_time_sec: 1.23,
    usage: {
      input_tokens: 10,
      cached_tokens: null,
      output_tokens: 20,
      reasoning_tokens: null,
      provider_total_tokens: 30,
      raw_usage_field_names: ["prompt_tokens", "completion_tokens", "total_tokens"],
      unavailable_fields: [],
    },
    output_text: outputText,
    output_excerpt: outputText,
    reference_paths: [],
    evaluator_metadata: {
      case_id: caseId,
      expected_behavior: ["Follow the expected behavior."],
      must_not: ["Do not make unsupported token-saving claims."],
      expected_references: [],
      pass_rule: "Pass if the output follows the expected behavior and avoids prohibited claims.",
    },
  };
}
