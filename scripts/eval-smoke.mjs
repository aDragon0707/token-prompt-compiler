#!/usr/bin/env node

import fs from "node:fs";
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

let cases = [];
const referenceCaseIds = new Set();
if (exists("tests/skill-trigger-cases.json")) {
  cases = readJson("tests/skill-trigger-cases.json");
  assert(Array.isArray(cases), "skill trigger cases are an array");
  assert(cases.length === 8, "skill trigger case count is 8");
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
    assert(parsed.case_count === 8, "skill effect runner includes 8 cases");
    assert(parsed.variant_count === 3, "skill effect runner includes A/B/C variants");
    assert(parsed.model_count === 2, "skill effect runner includes 2 dry-run models");
    assert(parsed.planned_calls === 96, "skill effect runner planned calls are 96");
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
  const result = spawnSync(process.execPath, [
    "scripts/provider-smoke.mjs",
    "--dry-run",
    "--provider",
    "tokendance",
    "--model",
    "deepseek-chat",
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
    assert(!JSON.stringify(parsed).includes("sk-"), "provider smoke output does not contain inline key-like values");
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(`eval smoke ok: ${cases.length} cases checked`);
