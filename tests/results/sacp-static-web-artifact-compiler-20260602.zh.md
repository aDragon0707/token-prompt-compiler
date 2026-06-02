# SACP Static Web Artifact Compiler Case

Date: 2026-06-02

Purpose: record a positive case where a SACP v0.1 task contract produced a strong static web artifact without overfitting the prompt to one benchmark's required strings.

This case follows the earlier negative-control result in `prompt-compiler-lab-static-page-ab-20260601.zh.md`.

## Setup

User task:

```text
Create a static webpage called Prompt Compiler Lab.
It should help users turn messy thoughts into GPT/Claude-ready prompts.
The page should look professional, include input/output, score, checklist, and work on mobile.
Keep it simple.
```

SACP compiler output used:

```text
Build the task described by this SACP contract.

Create a self-contained `index.html` static webpage for "Prompt Compiler Lab". It should be a polished, professional, responsive tool that helps users turn messy thoughts into GPT/Claude-ready prompts.

Hard requirements:
- Use only plain HTML, CSS, and JavaScript inside `index.html`.
- Do not use backend services, API keys, frameworks, package managers, or external model calls.
- The first screen must be the usable tool, not a marketing landing page.
- Include a messy idea input area.
- Include a compiled prompt output area.
- Include a visible quality score.
- Include a checklist for prompt quality.
- Include simple JavaScript that reads the user input and generates a structured prompt draft locally.
- Make it usable on mobile and desktop.
- Keep the project small and not overly complex.

After implementation, run the validator or manually check the same criteria. If any hard requirement fails, repair before final response.
```

Validator used:

```yaml
hard_validator:
  artifact: index.html
  required_strings:
    - "Prompt Compiler Lab"
    - "score"
    - "checklist"
  required_capabilities:
    - textarea or editable input for messy ideas
    - output panel or textarea for compiled prompt
    - local JavaScript event handling
    - visible scoring UI
    - visible checklist UI
    - responsive CSS
  forbidden:
    - required API key
    - required backend
    - required package install
    - external GPT/Claude API call
  manual_visual_check:
    - desktop layout is readable at 1440px width
    - mobile layout is readable at 390px width
    - text does not overlap
    - controls are discoverable
```

Self-repair gate:

```text
If validation fails, fix only index.html, keep the artifact static, and repair missing required sections before final response.
```

## Result

Artifact:

```text
C:\Users\86181\Documents\Codex\2026-06-02\text-build-the-task-described-by\index.html
```

Observed features:

- Single self-contained `index.html`.
- Plain HTML/CSS/JavaScript.
- No backend, package install, API key, framework, or external model call.
- First screen is the usable tool.
- Messy idea input.
- Compiled prompt output.
- Visible quality score.
- Dynamic prompt checklist.
- Local JavaScript transforms input into a structured prompt.
- Mobile responsive layout.
- Useful autonomy additions: sample input, style selector, copy, clear, tighten, add detail.

Independent verification performed after the run:

```text
JS syntax: PASS
desktop 1440x900: no overflow; compile, score, checklist, copy, clear verified
mobile 390x844: no overflow; compile, score, checklist, copy, clear verified
forbidden dependency scan: no React/Vue/Next/CDN/fetch/XMLHttpRequest
```

Estimated score under the task-specific SACP validator:

```text
17.5 / 18
```

The half-point gap is because the prompt allowed manual validation and the artifact did not include a separate `validate.js` script.

## Why This Matters

This is not proof that SACP makes every artifact better.

It shows a narrower claim:

```text
SACP can preserve the agent's useful product judgment while still locking scope, required sections, forbidden dependencies, validation, and repair behavior.
```

The important change from the prior negative-control case:

- Old compiled prompt risk: too much shape, not enough executable validation.
- Hard-gate prompt risk: high score for one benchmark, but overfits every static webpage to Prompt Compiler Lab-specific strings.
- SACP v0.1 contract: derives required sections from the actual task, adds validator and repair behavior, and leaves useful UI controls inside the autonomy budget.

## Claim Boundary

Safe claim:

```text
SACP improved this case by turning a broad webpage request into a bounded artifact contract with validator and repair behavior, without hard-coding benchmark-specific strings.
```

Unsafe claims:

```text
SACP always beats default Codex.
SACP should force Prompt IR/GPT/Claude/redaction sections into every webpage.
Longer compiled prompts are better.
```

## Protocol Lesson

For `static_web_artifact`, SACP should require:

```text
objective
input_boundaries
output_contract
validator
repair_policy
autonomy_budget
stop_rule
```

It should not automatically require:

```text
Prompt IR
GPT/OpenAI version
Claude version
[REDACTED_SECRET]
```

Those belong only when the user's task requires them.

