#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const casesDir = path.join(root, "benchmarks", "cases");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tpc-benchmark-"));
const errors = [];
const results = [];

try {
  if (!fs.existsSync(casesDir)) {
    failNow(`missing benchmark cases directory: ${path.relative(root, casesDir)}`);
  }

  const caseFiles = fs.readdirSync(casesDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(casesDir, name))
    .sort();

  if (caseFiles.length === 0) {
    fail("no benchmark case JSON files found");
  }

  for (const caseFile of caseFiles) {
    checkCase(caseFile);
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (errors.length > 0) {
  for (const error of errors) {
    process.stderr.write(`error: ${error}\n`);
  }
  process.exit(1);
}

for (const result of results) {
  process.stdout.write(`PASS ${result}\n`);
}
process.stdout.write(`benchmark smoke ok: ${results.length} checks\n`);

function checkCase(caseFile) {
  const relative = path.relative(root, caseFile);
  const json = readJson(caseFile);

  requireFields(json, relative, [
    "benchmark_id",
    "claim_type",
    "runner_status",
    "metrics",
    "pass_rule",
    "claim_boundary",
  ]);

  if (json.runner_status === "dry_run_supported") {
    requireFields(json, relative, [
      "task_id",
      "runner",
      "static_prefix",
      "input_files",
      "quality_rubric",
      "variants",
    ]);
    requireNested(json, relative, "variants.A");
    requireNested(json, relative, "variants.B");
    assertNoUnsafeClaim(json.claim_boundary, relative);
    assertRelativeExistingInputFiles(json, caseFile, relative);
    runDryRun(caseFile, relative);
  } else if (json.runner_status === "template_only") {
    requireFields(json, relative, ["why_template_only", "variant_design"]);
    requireNested(json, relative, "variant_design.A");
    requireNested(json, relative, "variant_design.B");
    assertNoUnsafeClaim(json.claim_boundary, relative);
    results.push(`${relative} template-only structure`);
  } else {
    fail(`${relative}: unsupported runner_status ${JSON.stringify(json.runner_status)}`);
  }
}

function runDryRun(caseFile, relative) {
  const tempOut = path.join(tempDir, `${path.basename(caseFile)}.result.json`);
  const run = spawnSync(
    process.execPath,
    ["scripts/tpc.mjs", "ab-test", "--dry-run", "--case", caseFile, "--out", tempOut],
    {
      cwd: root,
      env: {
        ...process.env,
        OPENAI_API_KEY: "",
        DEEPSEEK_API_KEY: "",
      },
      encoding: "utf8",
      shell: false,
    },
  );

  if (run.status !== 0) {
    fail(`${relative}: dry-run failed: ${run.stderr.trim() || run.stdout.trim()}`);
    return;
  }

  let output;
  try {
    output = JSON.parse(run.stdout);
  } catch (error) {
    fail(`${relative}: dry-run stdout is not JSON: ${error.message}`);
    return;
  }

  if (output.mode !== "dry-run" || output.execute !== false) {
    fail(`${relative}: dry-run output did not report mode dry-run and execute false`);
  }
  if (fs.existsSync(tempOut)) {
    fail(`${relative}: dry-run created output file ${tempOut}`);
  }
  results.push(`${relative} dry-run`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    fail(`${path.relative(root, filePath)}: JSON parse failed: ${error.message}`);
    return {};
  }
}

function requireFields(json, relative, fields) {
  for (const field of fields) {
    if (json[field] === undefined || json[field] === null || json[field] === "") {
      fail(`${relative}: missing required field ${field}`);
    }
  }
}

function requireNested(json, relative, fieldPath) {
  const value = fieldPath.split(".").reduce((node, key) => node?.[key], json);
  if (value === undefined || value === null || value === "") {
    fail(`${relative}: missing required field ${fieldPath}`);
  }
}

function assertRelativeExistingInputFiles(json, caseFile, relative) {
  if (!Array.isArray(json.input_files) || json.input_files.length === 0) {
    fail(`${relative}: input_files must be a non-empty array`);
    return;
  }

  for (const input of json.input_files) {
    if (!input?.path) {
      fail(`${relative}: input_files item missing path`);
      continue;
    }
    if (path.isAbsolute(input.path)) {
      fail(`${relative}: input_files path must be relative: ${input.path}`);
      continue;
    }
    const inputPath = path.resolve(path.dirname(caseFile), input.path);
    if (!fs.existsSync(inputPath)) {
      fail(`${relative}: input file does not exist: ${input.path}`);
    }
  }
}

function assertNoUnsafeClaim(claimBoundary, relative) {
  if (!claimBoundary?.safe || !claimBoundary?.unsafe) {
    fail(`${relative}: claim_boundary must include safe and unsafe fields`);
    return;
  }
  if (/(proven|proves|proof).*(save|saving)|save tokens/i.test(claimBoundary.safe)) {
    fail(`${relative}: claim_boundary.safe must not claim token savings are proven`);
  }
}

function fail(message) {
  errors.push(message);
}

function failNow(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}
