#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function sectionByHeading(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return "";
  }

  const nextHeadingOffset = lines
    .slice(start + 1)
    .findIndex((line) => /^##\s+/.test(line));
  const end = nextHeadingOffset === -1 ? lines.length : start + 1 + nextHeadingOffset;
  return lines.slice(start, end).join("\n");
}

function markdownFiles(relativeDir = "") {
  const absoluteDir = path.join(repoRoot, relativeDir);
  const files = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...markdownFiles(relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath.split(path.sep).join("/"));
    }
  }
  return files;
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

const skill = readText("SKILL.md");
const readme = readText("README.md");
const packageJson = JSON.parse(readText("package.json"));
const workflow = readText(".github/workflows/ci.yml");
const skillWordCount = skill.match(/\S+/g)?.length || 0;

const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
assert(Boolean(frontmatter), "SKILL.md has YAML frontmatter");
assert(skillWordCount <= 1600, "SKILL.md stays under 1600 words");
assert(!skill.includes("Read as needed:"), "SKILL.md does not duplicate Reference Router with Read as needed list");
assert(!skill.includes("## References"), "SKILL.md does not duplicate Reference Router with terminal References section");
for (const privateSkillName of ["karpathy-skill", "agent-cost-router", "audit-evolution"]) {
  assert(!skill.includes(privateSkillName), `SKILL.md avoids local-only dependency name: ${privateSkillName}`);
}

const description = frontmatter?.[1].match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
assert(description.startsWith("Use when"), "description starts with Use when");
assert(description.length > 0 && description.length <= 500, "description is concise");
assert(!description.includes("->"), "description avoids workflow arrows");

assert(skill.includes("## Intent Gate"), "SKILL.md has Intent Gate");
for (const phrase of [
  "Bare invocation",
  "compile-only",
  "Compile then execute",
  "prompt_lint",
  "model_adapter",
  "Benchmark",
]) {
  assert(skill.includes(phrase), `Intent Gate covers ${phrase}`);
}
assert(skill.includes("Ask one concise question"), "bare invocation asks one concise question");

assert(skill.includes("## Reference Router"), "SKILL.md has Reference Router");
const referenceRouter = sectionByHeading(skill, "## Reference Router");
assert(Boolean(referenceRouter), "Reference Router section can be isolated");
const requiredReferences = [
  "references/sacp-core.md",
  "references/prompt-ir-schema.md",
  "references/lint-rubric.md",
  "references/prompt-quality-gate.md",
  "references/adapters.md",
  "references/task-adapters.md",
  "references/validator-gates.md",
  "references/executable-validator-spec.md",
  "references/official-tools.md",
  "references/ab-test.md",
  "references/api-ab-test.md",
  "references/output-shapes.md",
  "references/codex-local-runtime.md",
];
for (const relativePath of requiredReferences) {
  assert(referenceRouter.includes(relativePath), `Reference Router mentions ${relativePath}`);
  assert(exists(relativePath), `reference exists: ${relativePath}`);
}
assert(referenceRouter.includes("Do not batch-read `references/`"), "Reference Router forbids batch reference loading");

const qualityGate = readText("references/prompt-quality-gate.md");
assert(skill.includes("## Prompt Quality Gate"), "SKILL.md has Prompt Quality Gate");
assert(qualityGate.includes("reflection_policy: skip | light | full"), "quality gate defines reflection_policy");
for (const policy of ["`skip`", "`light`", "`full`"]) {
  assert(qualityGate.includes(policy), `quality gate documents ${policy}`);
}
assert(qualityGate.includes("Do not expose a long reflection transcript"), "quality gate avoids long reflection output");
assert(qualityGate.includes("Do not use reflection to perform the user's downstream task"), "quality gate blocks task execution during reflection");

assert(skill.includes("Plan Escalation Rule"), "SKILL.md has Plan Escalation Rule");
assert(skill.includes("complex repo execution"), "Plan Escalation covers complex repo execution");
assert(skill.includes("real API calls or costs"), "Plan Escalation covers real API costs");

assert(readme.includes("为什么只说 `使用 token-prompt-compiler` 不够"), "README explains bare invocation");
assert(readme.includes("skill name") && readme.includes("request") && readme.includes("mode") && readme.includes("output"), "README explains the four-part invocation");
assert(readme.includes("reflection_policy"), "README includes prompt quality example");

assert(readme.includes("Safe:") && readme.includes("Unsafe:"), "README keeps English claim boundary");
assert(readme.includes("安全说法") && readme.includes("不安全说法"), "README keeps Chinese claim boundary");
assert(readme.includes("Dry-run support is not token-saving proof") || readme.includes("Dry-run 只证明"), "README states dry-run is not token-saving proof");

const referenceMentions = new Map();
for (const relativeMarkdownPath of markdownFiles()) {
  const text = readText(relativeMarkdownPath);
  for (const match of text.matchAll(/(?:`|\(|\[)(references\/[^`)\]\s]+\.md)/g)) {
    const mentionedPath = match[1];
    if (!referenceMentions.has(mentionedPath)) {
      referenceMentions.set(mentionedPath, new Set());
    }
    referenceMentions.get(mentionedPath).add(relativeMarkdownPath);
  }
}
for (const [relativePath, sourceFiles] of referenceMentions) {
  assert(exists(relativePath), `referenced markdown exists: ${relativePath} from ${[...sourceFiles].join(", ")}`);
}

assert(packageJson.scripts?.["skill:smoke"] === "node scripts/skill-chain-smoke.mjs", "package.json exposes skill:smoke");
assert(workflow.includes("node --check scripts/skill-chain-smoke.mjs"), "CI syntax-checks skill-chain smoke");
assert(workflow.includes("npm run skill:smoke"), "CI runs skill:smoke");

if (process.exitCode) {
  process.exit();
}

console.log(`skill chain smoke ok: ${referenceMentions.size} referenced reference files checked`);
