#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [command, ...args] = process.argv.slice(2);

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "ab-test") {
  runAbTest(args);
} else if (command === "validate") {
  runValidate();
} else {
  fail(`Unknown command: ${command}`);
}

function runAbTest(forwardedArgs) {
  const run = spawnSync(process.execPath, ["scripts/run-api-ab-test.mjs", ...forwardedArgs], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    shell: false,
  });
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  process.exit(run.status ?? 1);
}

function runValidate() {
  const errors = [];
  const warnings = [];
  const requiredFiles = [
    "README.md",
    "SKILL.md",
    "schemas/benchmark-case.schema.json",
    "scripts/run-api-ab-test.mjs",
    "scripts/run-claude-local-ab-test.mjs",
    "scripts/validate-json.mjs",
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(root, file))) {
      errors.push(`missing required file: ${file}`);
    }
  }

  for (const file of walk(path.join(root, "scripts")).filter((item) => item.endsWith(".mjs"))) {
    const relative = path.relative(root, file);
    const run = spawnSync(process.execPath, ["--check", relative], {
      cwd: root,
      encoding: "utf8",
      shell: false,
    });
    if (run.status !== 0) {
      errors.push(`syntax check failed: ${relative}\n${run.stderr.trim()}`);
    }
  }

  const jsonFiles = walk(path.join(root, "tests")).filter((item) => item.endsWith(".json"));
  for (const file of jsonFiles) {
    const relative = path.relative(root, file);
    const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      errors.push(`JSON parse failed: ${relative}: ${error.message}`);
      continue;
    }

    for (const ref of inputRefs(parsed)) {
      const refPath = path.isAbsolute(ref)
        ? ref
        : path.resolve(path.dirname(file), ref);
      if (!fs.existsSync(refPath)) {
        warnings.push(`missing evidence reference in ${relative}: ${ref}`);
      }
    }
  }

  for (const warning of warnings) {
    process.stderr.write(`warning: ${warning}\n`);
  }

  const jsonValidation = spawnSync(process.execPath, ["scripts/validate-json.mjs"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  if (jsonValidation.stdout) process.stdout.write(jsonValidation.stdout);
  if (jsonValidation.stderr) process.stderr.write(jsonValidation.stderr);
  if (jsonValidation.status !== 0) {
    errors.push("JSON schema validation failed");
  }

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`error: ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(`validate ok: ${requiredFiles.length} required files, ${jsonFiles.length} JSON files\n`);
}

function inputRefs(json) {
  const refs = [];
  for (const item of json.input_files || []) {
    if (item?.path) refs.push(item.path);
  }
  for (const items of Object.values(json.variant_input_files || {})) {
    for (const item of items || []) {
      if (item?.path) refs.push(item.path);
    }
  }
  return refs;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(fullPath));
    } else {
      output.push(fullPath);
    }
  }
  return output;
}

function printHelp() {
  process.stdout.write(`Usage:
  tpc --help
  tpc ab-test [--dry-run] [--execute] [--provider openai|deepseek] [--case tests/api-ab-case.zh.json]
  tpc validate

Commands:
  ab-test    Run the API A/B runner. Defaults to dry-run unless --execute is passed.
  validate   Run no-network repository checks.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
