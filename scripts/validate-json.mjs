#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const options = parseArgs(args);
const casesDir = options.benchmarkCasesDir || path.join(root, "benchmarks", "cases");
const schemaPath = path.join(root, "schemas", "benchmark-case.schema.json");
const errors = [];

const schema = readJson(schemaPath, "schema");
validateSchemaFile(schema, path.relative(root, schemaPath));

if (!fs.existsSync(casesDir)) {
  fail(`missing benchmark cases directory: ${path.relative(root, casesDir)}`);
} else {
  const caseFiles = fs.readdirSync(casesDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(casesDir, name))
    .sort();

  if (caseFiles.length === 0) {
    fail(`no benchmark case JSON files found in ${path.relative(root, casesDir)}`);
  }

  for (const caseFile of caseFiles) {
    validateBenchmarkCase(caseFile);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    process.stderr.write(`error: ${error}\n`);
  }
  process.exit(1);
}

process.stdout.write(`json validate ok: benchmark schema and cases\n`);

function validateSchemaFile(json, relative) {
  requireString(json, "$schema", relative);
  requireString(json, "$id", relative);
  requireString(json, "title", relative);
  requireValue(json, "properties.runner_status.enum", relative);
  const statuses = json?.properties?.runner_status?.enum;
  if (!Array.isArray(statuses) || !statuses.includes("dry_run_supported") || !statuses.includes("template_only")) {
    fail(`${relative}: properties.runner_status.enum must include dry_run_supported and template_only`);
  }
}

function validateBenchmarkCase(filePath) {
  const relative = path.relative(root, filePath);
  const json = readJson(filePath, relative);

  requireString(json, "benchmark_id", relative);
  requireString(json, "claim_type", relative);
  requireEnum(json, "runner_status", ["dry_run_supported", "template_only"], relative);
  requireStringArray(json, "metrics", relative);
  requireObject(json, "pass_rule", relative);
  requireNumberRange(json, "pass_rule.required_token_saving_ratio", 0, 1, relative);
  requireNumber(json, "pass_rule.required_quality_delta_min", relative);
  requireBoolean(json, "pass_rule.required_task_passed", relative);
  requireObject(json, "claim_boundary", relative);
  requireString(json, "claim_boundary.safe", relative);
  requireString(json, "claim_boundary.unsafe", relative);
  assertSafeClaimBoundary(json?.claim_boundary?.safe, relative);

  if (typeof json.benchmark_id === "string" && !/^[a-z0-9][a-z0-9-]*$/.test(json.benchmark_id)) {
    fail(`${relative}: benchmark_id must use lowercase kebab-case`);
  }

  if (json.runner_status === "dry_run_supported") {
    validateDryRunSupportedCase(json, filePath, relative);
  } else if (json.runner_status === "template_only") {
    validateTemplateOnlyCase(json, relative);
  }
}

function validateDryRunSupportedCase(json, filePath, relative) {
  requireString(json, "task_id", relative);
  requireString(json, "runner", relative);
  requireString(json, "static_prefix", relative);
  requireObject(json, "variants", relative);
  requireString(json, "variants.A", relative);
  requireString(json, "variants.B", relative);
  requireObject(json, "quality_rubric", relative);
  requireNumber(json, "quality_rubric.manual_score_total", relative);
  requireStringArray(json, "quality_rubric.dimensions", relative);

  if (json.runner !== "run-api-ab-test") {
    fail(`${relative}: runner must be run-api-ab-test for dry_run_supported cases`);
  }

  if (!Array.isArray(json.input_files) || json.input_files.length === 0) {
    fail(`${relative}: input_files must be a non-empty array`);
    return;
  }

  for (const [index, input] of json.input_files.entries()) {
    const prefix = `input_files.${index}`;
    requireString(input, "label", relative, prefix);
    requireString(input, "path", relative, prefix);
    if (typeof input?.path !== "string") continue;
    if (path.isAbsolute(input.path)) {
      fail(`${relative}: ${prefix}.path must be relative`);
      continue;
    }
    const resolved = path.resolve(path.dirname(filePath), input.path);
    if (!fs.existsSync(resolved)) {
      fail(`${relative}: ${prefix}.path does not exist: ${input.path}`);
    }
  }
}

function validateTemplateOnlyCase(json, relative) {
  requireString(json, "why_template_only", relative);
  requireObject(json, "variant_design", relative);
  for (const variant of ["A", "B"]) {
    requireObject(json, `variant_design.${variant}`, relative);
    requireString(json, `variant_design.${variant}.name`, relative);
    requireString(json, `variant_design.${variant}.evidence_shape`, relative);
    requireString(json, `variant_design.${variant}.purpose`, relative);
  }
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--benchmark-cases-dir") {
      const value = rawArgs[index + 1];
      if (!value) {
        process.stderr.write("error: --benchmark-cases-dir requires a value\n");
        process.exit(1);
      }
      parsed.benchmarkCasesDir = path.resolve(value);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      process.stderr.write(`error: unknown argument ${arg}\n`);
      process.exit(1);
    }
  }
  return parsed;
}

function readJson(filePath, relative) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    fail(`${relative}: JSON parse failed: ${error.message}`);
    return {};
  }
}

function requireObject(json, fieldPath, relative, prefix) {
  const label = qualify(prefix, fieldPath);
  const value = get(json, fieldPath);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${relative}: ${label} must be an object`);
  }
}

function requireString(json, fieldPath, relative, prefix) {
  const label = qualify(prefix, fieldPath);
  const value = get(json, fieldPath);
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${relative}: ${label} must be a non-empty string`);
  }
}

function requireStringArray(json, fieldPath, relative) {
  const value = get(json, fieldPath);
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    fail(`${relative}: ${fieldPath} must be a non-empty string array`);
  }
}

function requireNumber(json, fieldPath, relative) {
  const value = get(json, fieldPath);
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(`${relative}: ${fieldPath} must be a number`);
  }
}

function requireNumberRange(json, fieldPath, min, max, relative) {
  requireNumber(json, fieldPath, relative);
  const value = get(json, fieldPath);
  if (typeof value === "number" && !Number.isNaN(value) && (value < min || value > max)) {
    fail(`${relative}: ${fieldPath} must be between ${min} and ${max}`);
  }
}

function requireBoolean(json, fieldPath, relative) {
  const value = get(json, fieldPath);
  if (typeof value !== "boolean") {
    fail(`${relative}: ${fieldPath} must be a boolean`);
  }
}

function requireEnum(json, fieldPath, allowed, relative) {
  const value = get(json, fieldPath);
  if (!allowed.includes(value)) {
    fail(`${relative}: ${fieldPath} must be one of ${allowed.join(", ")}`);
  }
}

function requireValue(json, fieldPath, relative) {
  if (get(json, fieldPath) === undefined) {
    fail(`${relative}: missing required field ${fieldPath}`);
  }
}

function assertSafeClaimBoundary(safeClaim, relative) {
  if (typeof safeClaim !== "string") return;
  if (/(proven|proves|proof).*(save|saving)|save tokens/i.test(safeClaim)) {
    fail(`${relative}: claim_boundary.safe must not claim token savings are proven`);
  }
}

function get(json, fieldPath) {
  return fieldPath.split(".").reduce((node, key) => node?.[key], json);
}

function qualify(prefix, fieldPath) {
  return prefix ? `${prefix}.${fieldPath}` : fieldPath;
}

function fail(message) {
  errors.push(message);
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/validate-json.mjs [--benchmark-cases-dir <dir>]

Validates JSON schema files and benchmark case structure without network or provider API calls.
`);
}
