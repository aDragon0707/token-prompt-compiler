# Executable Validator Spec

Use this reference when a compiled prompt should produce a static artifact or code output that can be checked by a script.

The validator spec is not a permanent project script. It is a compact, task-local verifier that the worker can copy into a temporary file or implement inline.

## Spec Shape

```yaml
validator_spec:
  target_file:
  required_strings:
  forbidden_strings:
  required_interactions:
  syntax_check:
  responsive_check:
  secret_redaction_check:
  self_repair_rule:
```

## Static Web Artifact Defaults

Use for single-file HTML/CSS/JS pages, local tools, dashboards, and demos.

Derive `required_strings` and `required_interactions` from the user's requested artifact. Do not default every webpage to Prompt Compiler Lab, GPT/Claude sections, or secret redaction.

```yaml
target_file: index.html
required_strings:
  - "[requested title/product name]"
  - "[requested visible section]"
  - "[requested output label]"
  - "@media"
forbidden_strings:
  - React
  - Vue
  - Next.js
  - CDN
  - unpkg
  - jsdelivr
required_interactions:
  - "[primary action changes output or visible state]"
  - "[requested secondary control works]"
syntax_check: parse script blocks or run a basic JS syntax check
responsive_check: mobile width has no horizontal scroll when browser verification is available
secret_redaction_check: include only when secret handling is in scope
self_repair_rule: if any required item fails, revise once before final
```

Adjust required strings to match the user's wording. For example, if the user asks for "Claude prompt" instead of "Claude version", include the user's phrase and one stable equivalent.

## No-Dependency Node.js Template

Use this when the worker needs a quick static HTML check and no browser is required.

```js
// validate-static-web-artifact.js
const fs = require("fs");
const vm = require("vm");

const target = process.argv[2] || "index.html";
const html = fs.readFileSync(target, "utf8");

// Replace with strings derived from the SACP output_contract.
const required = [
  "REPLACE_WITH_REQUESTED_TITLE",
  "REPLACE_WITH_REQUIRED_SECTION",
  "@media",
];

const forbidden = [
  "React",
  "Vue",
  "Next.js",
  "CDN",
  "unpkg",
  "jsdelivr",
];

const failures = [];

for (const item of required) {
  if (!html.includes(item)) failures.push(`missing required string: ${item}`);
}

for (const item of forbidden) {
  if (html.toLowerCase().includes(item.toLowerCase())) {
    failures.push(`forbidden dependency/string found: ${item}`);
  }
}

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
for (const [index, script] of scripts.entries()) {
  try {
    new vm.Script(script);
  } catch (error) {
    failures.push(`script ${index + 1} syntax error: ${error.message}`);
  }
}

// Replace these with task-specific interaction checks from validator_spec.
if (!/<button[^>]*.*?(Generate|Compile|Submit|Run|Save)/is.test(html)) {
  failures.push("missing primary action button");
}

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("static web artifact validator: pass");
```

## Browser Check Add-On

Use a browser check when visual confidence matters. Keep it separate from the no-dependency script because browser tooling may not be available.

```text
Desktop: open target at 1366x900 and check no obvious overlap.
Mobile: open target at 390x844 and check document.scrollingElement.scrollWidth <= window.innerWidth.
Interaction: type sample input, click Generate, switch Claude/GPT, and confirm output changes.
Redaction: type a fake secret-like value and confirm output contains [REDACTED_SECRET].
```

## Few-Shot Lesson

Bad compiled prompt:

```text
Create a nice static page with input, output, score, checklist, and mobile support.
```

Why it fails:

```text
It can produce a decent page while missing visible Prompt IR, GPT/Claude versions, redaction, and executable validation.
```

Better compiled prompt:

```text
Create a single-file static page. Required visible sections: Prompt IR, GPT/OpenAI version, Claude version, Lint score, Validator checklist. Required behavior: Generate updates output, GPT/Claude mode changes output, secret-like values are emitted as [REDACTED_SECRET]. Forbidden: React, Vue, Next.js, CDN frameworks. You may add small product controls such as Copy, Tighten, Example, or Clear if they improve usability. Before final, run or emulate the validator; if any required item fails, revise once.
```

This better prompt is task-specific. For other static pages, replace the required sections and behavior checks with the user's actual artifact contract.
