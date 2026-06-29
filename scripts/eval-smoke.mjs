#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(repoPath(relativePath));
}

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

assert(exists("tests/skill-trigger-cases.json"), "skill trigger cases exist");
assert(exists("evals/rubrics/skill-effect-rubric.json"), "skill effect rubric exists");
assert(exists("scripts/run-skill-effect-eval.mjs"), "skill effect runner exists");
assert(exists("scripts/judge-skill-effect-eval.mjs"), "skill effect judge exists");

let cases = [];
const referenceCaseIds = new Set();
if (exists("tests/skill-trigger-cases.json")) {
  cases = readJson("tests/skill-trigger-cases.json");
  assert(Array.isArray(cases), "skill trigger cases are an array");
  assert(cases.length >= 8, "skill trigger case count is at least 8");
  for (const testCase of cases) {
    if ((testCase.expected_references || []).length > 0) {
      referenceCaseIds.add(testCase.id);
    }
  }
}

if (exists("evals/rubrics/skill-effect-rubric.json")) {
  const rubric = readJson("evals/rubrics/skill-effect-rubric.json");
  assert(Array.isArray(rubric.variants), "rubric defines variants");
  for (const variantId of ["A", "B", "C"]) {
    assert(rubric.variants.some((variant) => variant.id === variantId), `rubric defines variant ${variantId}`);
  }
}

if (exists("scripts/run-skill-effect-eval.mjs")) {
  const result = spawnSync(process.execPath, [
    "scripts/run-skill-effect-eval.mjs",
    "--dry-run",
    "--provider",
    "stepfun",
    "--models",
    "step-3.5-flash,step-3.7-flash",
    "--runs",
    "2",
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STEPFUN_API_KEY: "",
      TOKENDANCE_API_KEY: "",
      OPENAI_API_KEY: "",
      DEEPSEEK_API_KEY: "",
    },
  });

  assert(result.status === 0, "skill effect runner dry-run exits 0");
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
    pass("skill effect runner dry-run stdout is JSON");
  } catch {
    fail("skill effect runner dry-run stdout is JSON");
  }

  if (parsed) {
    assert(parsed.mode === "dry-run", "skill effect runner reports dry-run mode");
    assert(parsed.execute === false, "skill effect runner execute is false");
    assert(parsed.case_count === cases.length, "skill effect runner includes all trigger cases");
    assert(parsed.variant_count === 3, "skill effect runner includes A/B/C variants");
    assert(parsed.model_count === 2, "skill effect runner includes 2 dry-run models");
    assert(parsed.planned_calls === cases.length * 3 * 2 * 2, "skill effect runner planned calls match cases, variants, models, and runs");
    assert(Array.isArray(parsed.variants) && parsed.variants.join(",") === "A,B,C", "skill effect runner variants are A,B,C");
    assert(parsed.raw_out_path?.startsWith("eval-runs/"), "skill effect runner raw output path stays in eval-runs/");
    assert(parsed.summary_out_path?.startsWith("evals/results/"), "skill effect runner summary output path stays in evals/results/");
    assert(referenceCaseIds.has(parsed.sample_case_id), "skill effect runner samples a case with routed references");
    assert(Array.isArray(parsed.sample_variants) && parsed.sample_variants.length === 3, "skill effect runner previews three sample variants");
    const variantB = parsed.sample_variants.find((variant) => variant.id === "B");
    const variantC = parsed.sample_variants.find((variant) => variant.id === "C");
    assert(Array.isArray(variantB?.reference_paths) && variantB.reference_paths.length === 0, "variant B preview has no routed references");
    assert(Array.isArray(variantC?.reference_paths) && variantC.reference_paths.includes("references/sacp-core.md"), "variant C preview includes routed references");
    assert((variantB?.system_chars || 0) > 1000, "variant B preview includes skill instructions");
    assert((variantC?.prompt_chars || 0) > (variantB?.prompt_chars || 0), "variant C preview adds reference context");
    for (const variant of parsed.sample_variants) {
      assert(variant.evaluator_metadata_leaked === false, `variant ${variant.id} preview does not leak evaluator metadata`);
    }
  }
}

if (exists("scripts/provider-smoke.mjs")) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tpc-provider-smoke-"));
  const envFile = path.join(tempDir, ".env.local");
  fs.writeFileSync(envFile, [
    "STEPFUN_API_KEY=local-stepfun-test-key",
    "TOKENDANCE_API_KEY=local-tokendance-test-key",
    "TOKENDANCE_BASE_URL=https://example.invalid/gateway/v1",
    "",
  ].join("\n"), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/provider-smoke.mjs",
    "--dry-run",
    "--provider",
    "tokendance",
    "--model",
    "deepseek-chat",
    "--env-file",
    envFile,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STEPFUN_API_KEY: "",
      TOKENDANCE_API_KEY: "",
    },
  });

  assert(result.status === 0, "provider smoke dry-run exits 0");
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
    pass("provider smoke dry-run stdout is JSON");
  } catch {
    fail("provider smoke dry-run stdout is JSON");
  }

  if (parsed) {
    assert(parsed.mode === "dry-run", "provider smoke reports dry-run mode");
    assert(parsed.execute === false, "provider smoke execute is false");
    assert(parsed.provider === "tokendance", "provider smoke keeps provider id");
    assert(parsed.base_url === "https://example.invalid/gateway/v1", "provider smoke reads base URL from local env file");
    assert(parsed.env_file_loaded === true, "provider smoke reports local env file loaded");
    assert(!JSON.stringify(parsed).includes("sk-"), "provider smoke output does not contain inline key-like values");
    assert(!JSON.stringify(parsed).includes("local-stepfun-test-key"), "provider smoke output does not contain local env values");
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (exists("scripts/judge-skill-effect-eval.mjs")) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tpc-judge-eval-smoke-"));
  const fixturePath = path.join(tempDir, "skill-effect-raw.fixture.json");
  fs.writeFileSync(fixturePath, JSON.stringify({
    schema_version: "skill-effect-raw.v1",
    generated_at: "2026-06-12T00:00:00.000Z",
    provider: "fixture",
    base_url: "https://example.invalid/v1",
    case_path: "tests/skill-trigger-cases.json",
    models: ["fixture-model"],
    runs: 1,
    variants: [{ id: "A", name: "no_skill_baseline" }],
    planned_calls: 1,
    records: [{
      run_id: "fixture-bare-invocation-A-1",
      provider: "fixture",
      model: "fixture-model",
      case_id: "bare-invocation",
      variant_id: "A",
      variant_name: "no_skill_baseline",
      run_index: 1,
      status: "ok",
      http_status: 200,
      error_type: null,
      error_message: null,
      wall_time_sec: 1,
      usage: {
        input_tokens: 10,
        cached_tokens: null,
        output_tokens: 20,
        reasoning_tokens: null,
        provider_total_tokens: 30,
        raw_usage_field_names: ["prompt_tokens", "completion_tokens", "total_tokens"],
        unavailable_fields: [],
      },
      output_text: "What task material, execution mode, and desired output should I use?",
      output_excerpt: "What task material, execution mode, and desired output should I use?",
      reference_paths: [],
      evaluator_metadata: {
        case_id: "bare-invocation",
        expected_behavior: ["Ask one concise question."],
        must_not: ["Do not invent a task."],
        expected_references: [],
        pass_rule: "Pass if it asks for missing task material, mode, and desired output.",
      },
    }],
  }, null, 2), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/judge-skill-effect-eval.mjs",
    "--dry-run",
    "--input",
    fixturePath,
    "--raw-out",
    "eval-runs/eval-smoke-judge.raw.json",
    "--out",
    "evals/results/eval-smoke-judge.summary.json",
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

  assert(result.status === 0, "skill effect judge dry-run exits 0");
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
    pass("skill effect judge dry-run stdout is JSON");
  } catch {
    fail("skill effect judge dry-run stdout is JSON");
  }

  if (parsed) {
    assert(parsed.mode === "dry-run", "skill effect judge reports dry-run mode");
    assert(parsed.execute === false, "skill effect judge execute is false");
    assert(parsed.source_record_count === 1, "skill effect judge reads fixture record");
    assert(parsed.planned_judge_calls === 1, "skill effect judge plans one judge call");
    assert(parsed.raw_out_path?.startsWith("eval-runs/"), "skill effect judge raw output stays in eval-runs/");
    assert(parsed.summary_out_path?.startsWith("evals/results/"), "skill effect judge summary output stays in evals/results/");
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (process.exitCode) {
  process.exit();
}

console.log(`eval smoke ok: ${cases.length} cases checked`);
