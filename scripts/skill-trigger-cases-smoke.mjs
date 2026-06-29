#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const casesPath = "tests/skill-trigger-cases.json";
const guidePath = "tests/skill-trigger-cases.md";
const templatePath = "tests/results/skill-trigger-eval-template.md";

const requiredCaseIds = [
  "bare-invocation",
  "compile-only",
  "compile-then-execute",
  "prompt-lint-reflection",
  "model-adapter",
  "benchmark-claim",
  "complex-repo-plan-escalation",
  "small-scoped-skip-full-packet",
  "plain-pr-review-no-trigger",
  "single-typo-no-trigger",
  "runtime-performance-no-trigger",
  "ui-polish-no-trigger",
  "test-failure-debug-no-trigger",
  "generic-prose-polish-no-trigger",
  "model-choice-no-trigger",
];

const negativeCaseIds = new Set([
  "plain-pr-review-no-trigger",
  "single-typo-no-trigger",
  "runtime-performance-no-trigger",
  "ui-polish-no-trigger",
  "test-failure-debug-no-trigger",
  "generic-prose-polish-no-trigger",
  "model-choice-no-trigger",
]);

const requiredFields = [
  "id",
  "input",
  "expected_behavior",
  "must_not",
  "expected_references",
  "pass_rule",
];

const keywordRequirements = {
  "bare-invocation": ["Bare invocation", "Ask one concise question"],
  "compile-only": ["compile-only", "do not inspect"],
  "compile-then-execute": ["Compile then execute", "compiled boundaries"],
  "prompt-lint-reflection": ["prompt_lint", "Prompt Quality Gate", "reflection_policy"],
  "model-adapter": ["model_adapter", "GPT/OpenAI version", "Claude version"],
  "benchmark-claim": ["Benchmark", "provider usage evidence"],
  "complex-repo-plan-escalation": ["Plan Escalation Rule", "complex repo execution"],
  "small-scoped-skip-full-packet": ["Small: already scoped", "skip Full Packet"],
  "plain-pr-review-no-trigger": ["When Not To Use", "ordinary code review"],
  "single-typo-no-trigger": ["When Not To Use", "single exact edit"],
  "runtime-performance-no-trigger": ["When Not To Use", "runtime performance"],
  "ui-polish-no-trigger": ["When Not To Use", "UI/product design"],
  "test-failure-debug-no-trigger": ["When Not To Use", "test failure debugging"],
  "generic-prose-polish-no-trigger": ["When Not To Use", "generic prose polishing"],
  "model-choice-no-trigger": ["When Not To Use", "model/provider choice"],
};

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function assert(condition, message) {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

function assertNonEmptyString(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} is a non-empty string`);
}

function assertNonEmptyStringArray(value, label) {
  assert(Array.isArray(value) && value.length > 0, `${label} is a non-empty array`);
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      assert(typeof item === "string" && item.trim().length > 0, `${label}[${index}] is a non-empty string`);
    }
  }
}

function assertStringArray(value, label) {
  assert(Array.isArray(value), `${label} is an array`);
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      assert(typeof item === "string" && item.trim().length > 0, `${label}[${index}] is a non-empty string`);
    }
  }
}

function normalizeInput(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function extractManualInputs(guide) {
  const headings = [...guide.matchAll(/^### `([^`]+)`\s*$/gm)];
  const inputs = new Map();

  for (const [index, heading] of headings.entries()) {
    const caseId = heading[1];
    const sectionStart = heading.index + heading[0].length;
    const sectionEnd = headings[index + 1]?.index ?? guide.length;
    const section = guide.slice(sectionStart, sectionEnd);
    const textBlock = section.match(/```text\s*\n([\s\S]*?)\n```/);

    if (textBlock) {
      inputs.set(caseId, textBlock[1]);
    }
  }

  return inputs;
}

assert(exists(casesPath), `${casesPath} exists`);
assert(exists(guidePath), `${guidePath} exists`);
assert(exists(templatePath), `${templatePath} exists`);

const skill = readText("SKILL.md");
const readme = readText("README.md");
const combinedDocs = `${skill}\n${readme}`;

let cases = [];
if (exists(casesPath)) {
  const parsed = JSON.parse(readText(casesPath));
  assert(Array.isArray(parsed), `${casesPath} is a JSON array`);
  cases = Array.isArray(parsed) ? parsed : [];
}

const ids = new Set(cases.map((testCase) => testCase.id));
for (const id of requiredCaseIds) {
  assert(ids.has(id), `required case exists: ${id}`);
}
assert(cases.length === requiredCaseIds.length, "case count matches required case list");

for (const testCase of cases) {
  assert(requiredCaseIds.includes(testCase.id), `case id is known: ${testCase.id}`);
  for (const field of requiredFields) {
    assert(Object.hasOwn(testCase, field), `${testCase.id} has ${field}`);
  }

  assertNonEmptyString(testCase.id, `${testCase.id}.id`);
  assertNonEmptyString(testCase.input, `${testCase.id}.input`);
  assertNonEmptyStringArray(testCase.expected_behavior, `${testCase.id}.expected_behavior`);
  assertNonEmptyStringArray(testCase.must_not, `${testCase.id}.must_not`);
  assertStringArray(testCase.expected_references, `${testCase.id}.expected_references`);
  assertNonEmptyString(testCase.pass_rule, `${testCase.id}.pass_rule`);

  for (const relativePath of testCase.expected_references) {
    assert(relativePath.startsWith("references/"), `${testCase.id} expected reference uses references/: ${relativePath}`);
    assert(exists(relativePath), `${testCase.id} expected reference exists: ${relativePath}`);
  }

  if (negativeCaseIds.has(testCase.id)) {
    assert(testCase.expected_references.length === 0, `${testCase.id} does not route to token-prompt-compiler references`);
    assert(
      /does not use token-prompt-compiler/i.test(testCase.pass_rule),
      `${testCase.id} pass rule requires no token-prompt-compiler use`
    );
  }

  for (const keyword of keywordRequirements[testCase.id] ?? []) {
    assert(combinedDocs.includes(keyword), `${testCase.id} keyword still documented: ${keyword}`);
  }
}

if (exists(guidePath)) {
  const guide = readText(guidePath);
  const manualInputs = extractManualInputs(guide);

  for (const id of requiredCaseIds) {
    assert(guide.includes(id), `${guidePath} mentions ${id}`);
  }

  for (const testCase of cases) {
    assert(manualInputs.has(testCase.id), `${guidePath} has manual input block for ${testCase.id}`);
    if (manualInputs.has(testCase.id)) {
      assert(
        normalizeInput(manualInputs.get(testCase.id)) === normalizeInput(testCase.input),
        `${guidePath} manual input matches JSON for ${testCase.id}`
      );
    }
  }

  assert(guide.includes("manual") || guide.includes("人工"), `${guidePath} explains manual evaluation`);
}

if (exists(templatePath)) {
  const template = readText(templatePath);
  for (const phrase of ["model/runtime", "date", "case id", "observed behavior", "references read", "pass/fail", "notes"]) {
    assert(template.includes(phrase), `${templatePath} includes ${phrase}`);
  }
  assert(template.includes("not token/cost proof"), `${templatePath} separates trigger quality from token/cost proof`);
}

if (process.exitCode) {
  process.exit();
}

console.log(`skill trigger cases smoke ok: ${cases.length} cases checked`);
