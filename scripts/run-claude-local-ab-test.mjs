#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const casePath = args.case || "tests/api-ab-case.zh.json";
const runs = Number(args.runs || 1);
const order = args.order || "AB";
const maxBudgetUsd = args.max_budget_usd || "0.50";
const outPath = args.out || `tests/results/claude-local-ab-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

if (!["AB", "BA"].includes(order)) fail("--order must be AB or BA");
if (!Number.isInteger(runs) || runs < 1) fail("--runs must be a positive integer");

const testCase = JSON.parse(await fs.readFile(casePath, "utf8"));
const runOrder = order.split("");
const records = [];
const caseDir = path.dirname(path.resolve(casePath));

for (let runIndex = 0; runIndex < runs; runIndex += 1) {
  for (const variantId of runOrder) {
    const sharedEvidence = await loadSharedEvidence(testCase, caseDir, variantId);
    const prompt = buildPrompt(testCase, sharedEvidence, variantId);
    const raw = await runClaude(prompt, testCase.static_prefix || "", maxBudgetUsd);
    const record = {
      run_id: `${testCase.task_id || "claude-ab"}-${variantId.toLowerCase()}-${runIndex + 1}`,
      task_id: testCase.task_id || null,
      runner: "claude-code-cli",
      variant_id: variantId,
      variant_name: variantId === "A" ? "original_prompt" : "machine_task_packet",
      prompt_chars: prompt.length,
      output_chars: (raw.result || "").length,
      output_text: raw.result || "",
      total_cost_usd: raw.total_cost_usd ?? null,
      duration_ms: raw.duration_ms ?? null,
      usage: normalizeUsage(raw.usage || {}),
      modelUsage: raw.modelUsage || null,
      raw,
    };
    records.push(record);
    process.stderr.write(`${record.variant_id} run ${runIndex + 1}: $${record.total_cost_usd} input=${record.usage.input_tokens} output=${record.usage.output_tokens}\n`);
  }
}

const result = {
  schema_version: "local-claude-ab-result.v1",
  task_id: testCase.task_id || null,
  runner: "claude-code-cli",
      fixed_conditions: {
    runs,
    order,
    tools: "disabled",
    output_format: "json",
    same_shared_evidence: !testCase.variant_input_files,
    variant_input_files: testCase.variant_input_files || null,
    max_budget_usd: maxBudgetUsd,
    input_files: testCase.input_files || [],
  },
  field_notes: {
    available: [
      "input_tokens",
      "cache_creation_input_tokens",
      "cache_read_input_tokens",
      "output_tokens",
      "total_cost_usd",
    ],
    unavailable: ["reasoning_tokens", "openai_cached_tokens"],
    warning: "This measures local Claude Code provider usage and behavior quality, not OpenAI API usage.",
  },
  variant_summaries: summarize(records),
  records,
};

await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${outPath}\n`);

async function loadSharedEvidence(testCase, caseDir, variantId) {
  const parts = [];
  const files = testCase.variant_input_files?.[variantId] || testCase.input_files || [];
  for (const file of files) {
    const filePath = path.isAbsolute(file.path) ? file.path : path.resolve(caseDir, file.path);
    const content = await fs.readFile(filePath, "utf8");
    parts.push(`FILE: ${file.label || path.basename(filePath)}\nPATH: ${file.path}\n---\n${content}\n---`);
  }
  return parts.join("\n\n");
}

function buildPrompt(testCase, sharedEvidence, variantId) {
  return `Shared evidence for both variants:\n\n${sharedEvidence}\n\n${testCase.variants[variantId]}`;
}

function runClaude(prompt, systemPrompt, maxBudgetUsd) {
  return new Promise((resolve, reject) => {
    const command = "claude";
    const child = spawn(command, [
      "-p",
      "--output-format", "json",
      "--tools", "",
      "--permission-mode", "dontAsk",
      "--max-budget-usd", maxBudgetUsd,
      "--system-prompt", systemPrompt,
    ], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => stdout += chunk);
    child.stderr.on("data", (chunk) => stderr += chunk);
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Failed to parse Claude JSON: ${error.message}\nSTDERR:${stderr}\nSTDOUT:${stdout}`));
      }
    });
    child.stdin.setDefaultEncoding("utf8");
    child.stdin.end(prompt, "utf8");
  });
}

function normalizeUsage(usage) {
  return {
    input_tokens: numberOrNull(usage.input_tokens),
    cache_creation_input_tokens: numberOrNull(usage.cache_creation_input_tokens),
    cache_read_input_tokens: numberOrNull(usage.cache_read_input_tokens),
    output_tokens: numberOrNull(usage.output_tokens),
    server_tool_use: usage.server_tool_use || null,
  };
}

function summarize(records) {
  const groups = { A: [], B: [] };
  for (const record of records) groups[record.variant_id]?.push(record);
  const output = {};
  for (const [variantId, items] of Object.entries(groups)) {
    output[variantId] = {
      runs: items.length,
      avg_total_cost_usd: avg(items.map((item) => item.total_cost_usd)),
      avg_input_tokens: avg(items.map((item) => item.usage.input_tokens)),
      avg_cache_read_input_tokens: avg(items.map((item) => item.usage.cache_read_input_tokens)),
      avg_cache_creation_input_tokens: avg(items.map((item) => item.usage.cache_creation_input_tokens)),
      avg_output_tokens: avg(items.map((item) => item.usage.output_tokens)),
      avg_output_chars: avg(items.map((item) => item.output_chars)),
    };
  }
  if (output.A.avg_total_cost_usd && output.B.avg_total_cost_usd !== null) {
    output.token_cost_delta_pct_b_vs_a = round((output.B.avg_total_cost_usd - output.A.avg_total_cost_usd) / output.A.avg_total_cost_usd);
  }
  return output;
}

function avg(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function round(value) {
  return Number(value.toFixed(6));
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--help" || item === "-h") {
      parsed.help = true;
    } else if (item.startsWith("--")) {
      const key = item.slice(2).replaceAll("-", "_");
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        parsed[key] = true;
      } else {
        parsed[key] = next;
        i += 1;
      }
    }
  }
  return parsed;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/run-claude-local-ab-test.mjs --case tests/api-ab-case-large.zh.json --runs 1 --order AB --max-budget-usd 0.80 --out tests/results/claude-large-ab.json

Notes:
  - Uses local Claude Code auth.
  - Disables tools and feeds identical shared evidence to A/B.
  - Measures Claude Code usage/cost, not OpenAI API usage.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
