#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tpc-schema-smoke-"));
const results = [];

try {
  expectPass(["scripts/validate-json.mjs"], "current benchmark cases validate");
  expectPass(["scripts/tpc.mjs", "validate"], "tpc validate runs JSON validator", {
    stdoutIncludes: ["json validate ok"],
  });

  const invalidDir = path.join(tempDir, "invalid-cases");
  fs.mkdirSync(invalidDir, { recursive: true });
  fs.writeFileSync(path.join(invalidDir, "README.md"), "# Fixture\n");
  fs.writeFileSync(
    path.join(invalidDir, "missing-unsafe.json"),
    JSON.stringify({
      benchmark_id: "missing-unsafe",
      claim_type: "api_shared_evidence_ab",
      runner_status: "dry_run_supported",
      task_id: "missing-unsafe",
      runner: "run-api-ab-test",
      static_prefix: "Test prefix.",
      input_files: [{ label: "README.md", path: "README.md" }],
      quality_rubric: {
        manual_score_total: 10,
        dimensions: ["one dimension"],
      },
      variants: {
        A: "Baseline prompt",
        B: "Compiled prompt",
      },
      metrics: ["input_tokens", "output_tokens", "task_passed", "quality_score", "total_cost"],
      pass_rule: {
        required_token_saving_ratio: 0.25,
        required_quality_delta_min: -1,
        required_task_passed: true,
      },
      claim_boundary: {
        safe: "This case is structurally runnable.",
      },
    }, null, 2),
  );

  expectFail(
    ["scripts/validate-json.mjs", "--benchmark-cases-dir", invalidDir],
    "claim_boundary.unsafe",
    "missing unsafe claim is rejected",
  );

  const badRatioDir = path.join(tempDir, "bad-ratio-cases");
  fs.mkdirSync(badRatioDir, { recursive: true });
  fs.writeFileSync(path.join(badRatioDir, "README.md"), "# Fixture\n");
  fs.writeFileSync(
    path.join(badRatioDir, "bad-ratio.json"),
    JSON.stringify({
      benchmark_id: "bad-ratio",
      claim_type: "api_shared_evidence_ab",
      runner_status: "dry_run_supported",
      task_id: "bad-ratio",
      runner: "run-api-ab-test",
      static_prefix: "Test prefix.",
      input_files: [{ label: "README.md", path: "README.md" }],
      quality_rubric: {
        manual_score_total: 10,
        dimensions: ["one dimension"],
      },
      variants: {
        A: "Baseline prompt",
        B: "Compiled prompt",
      },
      metrics: ["input_tokens", "output_tokens", "task_passed", "quality_score", "total_cost"],
      pass_rule: {
        required_token_saving_ratio: 2,
        required_quality_delta_min: -1,
        required_task_passed: true,
      },
      claim_boundary: {
        safe: "This case is structurally runnable.",
        unsafe: "This case proves SACP or task packets save tokens.",
      },
    }, null, 2),
  );

  expectFail(
    ["scripts/validate-json.mjs", "--benchmark-cases-dir", badRatioDir],
    "pass_rule.required_token_saving_ratio",
    "token saving ratio above 1 is rejected",
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

for (const result of results) {
  process.stdout.write(`PASS ${result}\n`);
}
process.stdout.write(`schema smoke ok: ${results.length} checks\n`);

function expectPass(args, label, expectation = {}) {
  const run = runNode(args);
  if (run.status !== 0) {
    fail(`${label}: expected pass, got exit ${run.status}\n${run.stderr || run.stdout}`);
  }
  for (const text of expectation.stdoutIncludes || []) {
    if (!run.stdout.includes(text)) {
      fail(`${label}: stdout missing ${JSON.stringify(text)}\n${run.stdout}`);
    }
  }
  results.push(label);
}

function expectFail(args, expectedText, label) {
  const run = runNode(args);
  const output = `${run.stdout}\n${run.stderr}`;
  if (run.status === 0) {
    fail(`${label}: expected failure, got exit 0`);
  }
  if (!output.includes(expectedText)) {
    fail(`${label}: expected output to include ${JSON.stringify(expectedText)}\n${output}`);
  }
  results.push(label);
}

function runNode(args) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    env: {
      ...process.env,
      OPENAI_API_KEY: "",
      DEEPSEEK_API_KEY: "",
    },
    encoding: "utf8",
    shell: false,
  });
}

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}
