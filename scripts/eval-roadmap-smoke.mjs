#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const requiredFiles = [
  "evals/standards.md",
  "evals/roadmap.json",
  "evals/providers.example.json",
  "evals/provider-setup.md",
  "evals/rubrics/skill-effect-rubric.json",
  "evals/results/README.md",
  "scripts/provider-smoke.mjs",
  "scripts/run-skill-effect-eval.mjs",
  "scripts/eval-smoke.mjs",
];

const requiredPhases = [
  "phase5-static-effect-eval",
  "phase6-one-shot-judge-summary",
  "phase7-bounded-agent-loop-eval",
  "phase8-multi-provider-benchmark",
];

const requiredEnvNames = [
  "STEPFUN_API_KEY",
  "TOKENDANCE_API_KEY",
  "TOKENDANCE_BASE_URL",
];

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

for (const file of requiredFiles) {
  assert(exists(file), `${file} exists`);
}

if (exists("evals/roadmap.json")) {
  const roadmap = readJson("evals/roadmap.json");
  assert(roadmap.schema_version === "skill-eval-roadmap.v1", "roadmap schema version is skill-eval-roadmap.v1");
  assert(Array.isArray(roadmap.phases), "roadmap has phases array");

  const phaseIds = new Set((roadmap.phases || []).map((phase) => phase.id));
  for (const phaseId of requiredPhases) {
    assert(phaseIds.has(phaseId), `roadmap includes ${phaseId}`);
  }

  assert(roadmap.raw_results_dir === "eval-runs/", "roadmap raw results dir is eval-runs/");
  assert(roadmap.public_results_dir === "evals/results/", "roadmap public results dir is evals/results/");
  assert(roadmap.first_real_eval_budget?.currency === "RMB", "roadmap budget currency is RMB");
  assert(roadmap.first_real_eval_budget?.min === 200, "roadmap budget min is 200");
  assert(roadmap.first_real_eval_budget?.max === 300, "roadmap budget max is 300");
}

if (exists("evals/providers.example.json")) {
  const providers = readJson("evals/providers.example.json");
  assert(Array.isArray(providers.providers), "providers example has providers array");
  const providerIds = new Set(providers.providers.map((provider) => provider.id));
  for (const id of ["stepfun", "tokendance", "openai-compatible"]) {
    assert(providerIds.has(id), `providers example includes ${id}`);
  }

  const serialized = JSON.stringify(providers);
  for (const envName of requiredEnvNames) {
    assert(serialized.includes(envName), `providers example references ${envName}`);
  }
  assert(!serialized.includes("sk-"), "providers example does not contain inline API keys");
}

if (exists("evals/standards.md")) {
  const standards = readText("evals/standards.md");
  for (const phrase of ["Claude Skills", "OpenAI Trace Grading", "StepFun", "TokenDance", "Agent skill community"]) {
    assert(standards.includes(phrase), `standards mention ${phrase}`);
  }
  assert(standards.includes("not token-saving proof"), "standards keep token-saving claim boundary");
}

if (exists("evals/rubrics/skill-effect-rubric.json")) {
  const rubric = readJson("evals/rubrics/skill-effect-rubric.json");
  assert(rubric.schema_version === "skill-effect-rubric.v1", "rubric schema version is skill-effect-rubric.v1");
  for (const dimension of [
    "trigger_correctness",
    "boundary_following",
    "reference_routing",
    "claim_safety",
    "prompt_quality",
    "over_packet_penalty",
    "output_usefulness",
  ]) {
    assert(Boolean(rubric.dimensions?.[dimension]), `rubric defines ${dimension}`);
  }
}

if (exists(".gitignore")) {
  const gitignore = readText(".gitignore");
  assert(/^eval-runs\/$/m.test(gitignore), ".gitignore protects eval-runs/");
  assert(/^evals\/providers\.local\.json$/m.test(gitignore), ".gitignore protects evals/providers.local.json");
}

if (exists("package.json")) {
  const pkg = readJson("package.json");
  assert(pkg.scripts?.["eval:roadmap"] === "node scripts/eval-roadmap-smoke.mjs", "package exposes eval:roadmap");
  assert(pkg.scripts?.["eval:smoke"] === "node scripts/eval-smoke.mjs", "package exposes eval:smoke");
  assert(pkg.scripts?.["provider:smoke"] === "node scripts/provider-smoke.mjs", "package exposes provider:smoke");
}

if (exists(".github/workflows/ci.yml")) {
  const ci = readText(".github/workflows/ci.yml");
  assert(ci.includes("node --check scripts/eval-roadmap-smoke.mjs"), "CI syntax-checks eval-roadmap smoke");
  assert(ci.includes("node --check scripts/eval-smoke.mjs"), "CI syntax-checks eval smoke");
  assert(ci.includes("node --check scripts/provider-smoke.mjs"), "CI syntax-checks provider smoke");
  assert(ci.includes("node --check scripts/run-skill-effect-eval.mjs"), "CI syntax-checks skill effect runner");
  assert(ci.includes("npm run eval:roadmap"), "CI runs eval:roadmap");
  assert(ci.includes("npm run eval:smoke"), "CI runs eval:smoke");
}

if (process.exitCode) {
  process.exit();
}

console.log("eval roadmap smoke ok");
