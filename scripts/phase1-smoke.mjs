#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tpc-phase1-"));
const tempCase = path.join(tempDir, "missing-evidence-case.json");
const tempOut = path.join(tempDir, "should-not-exist.json");
const baseEnv = {
  ...process.env,
  OPENAI_API_KEY: "",
  DEEPSEEK_API_KEY: "",
};

const results = [];

try {
  fs.writeFileSync(
    tempCase,
    `${JSON.stringify(
      {
        task_id: "phase1-missing-evidence",
        input_files: [{ label: "missing", path: "Z:/definitely-missing/nope.md" }],
        variants: { A: "A", B: "B" },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  check("syntax run-api", [process.execPath, ["--check", "scripts/run-api-ab-test.mjs"]], { status: 0 });
  check("syntax claude-local", [process.execPath, ["--check", "scripts/run-claude-local-ab-test.mjs"]], { status: 0 });
  check("syntax tpc", [process.execPath, ["--check", "scripts/tpc.mjs"]], { status: 0 });
  check("syntax smoke", [process.execPath, ["--check", "scripts/phase1-smoke.mjs"]], { status: 0 });

  check("cli help", [process.execPath, ["scripts/tpc.mjs", "--help"]], {
    status: 0,
    stdoutIncludes: ["ab-test", "validate"],
  });

  check("runner help budget wording", [process.execPath, ["scripts/run-api-ab-test.mjs", "--help"]], {
    status: 0,
    stdoutIncludes: ["does not enforce provider spend"],
  });

  const dryRun = check(
    "cli dry-run missing evidence",
    [
      process.execPath,
      [
        "scripts/tpc.mjs",
        "ab-test",
        "--dry-run",
        "--case",
        tempCase,
        "--out",
        tempOut,
      ],
    ],
    {
      status: 0,
      stdoutIncludes: ['"mode": "dry-run"', '"execute": false'],
    },
  );
  assertNoFile("dry-run does not write output", tempOut);
  assertValidJson("dry-run stdout is JSON", dryRun.stdout);

  check("validate", [process.execPath, ["scripts/tpc.mjs", "validate"]], { status: 0 });

  check(
    "execute missing openai key",
    [
      process.execPath,
      [
        "scripts/run-api-ab-test.mjs",
        "--provider",
        "openai",
        "--execute",
        "--case",
        tempCase,
      ],
    ],
    {
      statusNot: 0,
      stderrIncludes: ["Missing OPENAI_API_KEY"],
      stderrExcludes: ["node:internal", "Bearer"],
    },
  );

  check(
    "execute missing evidence no stack",
    [
      process.execPath,
      [
        "scripts/run-api-ab-test.mjs",
        "--provider",
        "openai",
        "--execute",
        "--case",
        tempCase,
      ],
    ],
    {
      statusNot: 0,
      env: { OPENAI_API_KEY: "dummy" },
      stderrIncludes: ["Failed to read evidence"],
      stderrExcludes: ["node:internal", "Bearer"],
    },
  );

  check(
    "default dry-run",
    [process.execPath, ["scripts/run-api-ab-test.mjs", "--provider", "openai", "--case", tempCase]],
    {
      status: 0,
      stdoutIncludes: ['"mode": "dry-run"', '"execute": false'],
    },
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const failed = results.filter((result) => !result.pass);
for (const result of results) {
  process.stdout.write(`${result.pass ? "PASS" : "FAIL"} ${result.name}\n`);
  if (!result.pass) {
    process.stdout.write(`  command: ${result.command}\n`);
    process.stdout.write(`  status: ${result.status}\n`);
    if (result.stdout) process.stdout.write(`  stdout: ${trim(result.stdout)}\n`);
    if (result.stderr) process.stdout.write(`  stderr: ${trim(result.stderr)}\n`);
    if (result.error) process.stdout.write(`  error: ${result.error}\n`);
  }
}

if (failed.length > 0) {
  process.exit(1);
}

function check(name, [command, args], expectation) {
  const run = spawnSync(command, args, {
    cwd: root,
    env: { ...baseEnv, ...(expectation.env || {}) },
    encoding: "utf8",
    shell: false,
  });
  const result = {
    name,
    command: `${command} ${args.join(" ")}`,
    status: run.status,
    stdout: run.stdout || "",
    stderr: run.stderr || "",
    pass: true,
  };
  if (run.error) {
    result.pass = false;
    result.error = run.error.message;
  }

  if (expectation.status !== undefined && run.status !== expectation.status) {
    result.pass = false;
    result.error = `expected status ${expectation.status}`;
  }
  if (expectation.statusNot !== undefined && run.status === expectation.statusNot) {
    result.pass = false;
    result.error = `expected status not ${expectation.statusNot}`;
  }
  for (const text of expectation.stdoutIncludes || []) {
    if (!result.stdout.includes(text)) {
      result.pass = false;
      result.error = `stdout missing ${JSON.stringify(text)}`;
    }
  }
  for (const text of expectation.stderrIncludes || []) {
    if (!result.stderr.includes(text)) {
      result.pass = false;
      result.error = `stderr missing ${JSON.stringify(text)}`;
    }
  }
  for (const text of expectation.stderrExcludes || []) {
    if (result.stderr.includes(text)) {
      result.pass = false;
      result.error = `stderr unexpectedly included ${JSON.stringify(text)}`;
    }
  }

  results.push(result);
  return result;
}

function assertNoFile(name, filePath) {
  results.push({
    name,
    command: `test ! -f ${filePath}`,
    status: fs.existsSync(filePath) ? 1 : 0,
    stdout: "",
    stderr: "",
    pass: !fs.existsSync(filePath),
    error: fs.existsSync(filePath) ? "file exists" : undefined,
  });
}

function assertValidJson(name, text) {
  try {
    JSON.parse(text);
    results.push({ name, command: "JSON.parse(stdout)", status: 0, stdout: "", stderr: "", pass: true });
  } catch (error) {
    results.push({
      name,
      command: "JSON.parse(stdout)",
      status: 1,
      stdout: text,
      stderr: "",
      pass: false,
      error: error.message,
    });
  }
}

function trim(text) {
  return text.replace(/\s+/g, " ").slice(0, 500);
}
