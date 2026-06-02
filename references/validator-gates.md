# Validator Gates

Use this reference when the compiled prompt will produce an artifact, code change, research claim, or model-specific prompt that can drift from the user's real requirements.

A validator gate is stronger than a checklist. It tells the model or agent what must be inspected before final output and what to do if a requirement is missing.

When a validator should become a script, use `executable-validator-spec.md`.

## Gate Shape

```text
Hard validator:
- [observable requirement]
- [observable requirement]
- [forbidden behavior]

Self-repair gate:
Before final answer, check every validator item.
If any item fails, revise once before responding.
If the item cannot be verified, state "unverified" and explain what evidence is missing.
```

Good validators are observable. Avoid vague gates like "make it professional" unless they are paired with concrete evidence.

## Task Type Selection

Add `task_type` to Prompt IR when the output domain changes the validator.

```yaml
task_type: prompt_lint | model_adapter | static_web_artifact | code_change | research_summary | writing_artifact | agent_handoff
```

Use the smallest gate that prevents the likely miss. Do not add browser checks to a pure writing task, and do not add citation requirements to a local HTML artifact unless factual claims are being made.

## Static Web Artifact Gate

Use for HTML/CSS/JS pages, dashboards, tools, demos, and visual artifacts.

```text
Hard validator:
- Exactly the requested file(s) are created or changed.
- Required visible sections are present by name.
- Required interactions exist.
- Required strings/selectors exist.
- Forbidden frameworks/dependencies are absent.
- Responsive layout rule is present.
- Text does not obviously overflow fixed controls.
- Secrets or credential-like values are redacted as [REDACTED_SECRET] when relevant.

Verification examples:
- Check file exists.
- Check required strings/selectors exist.
- Check no forbidden dependency strings exist.
- Run syntax/parser check when available.
- Use browser/mobile screenshot check when the user asks for visual confidence.
```

Derive required strings from the user's requested artifact. Do not use one benchmark's strings as universal defaults.

For a generic static web artifact, start with:

```text
[requested title/product name]
[requested visible section names]
[requested output labels]
@media
```

For Prompt Compiler Lab-style tools only, useful required strings may include:

```text
Prompt IR
GPT/OpenAI version
Claude version
Lint score
Validator checklist
[REDACTED_SECRET]
@media
```

Default forbidden dependency strings are:

```text
React
Vue
Next.js
CDN
unpkg
jsdelivr
```

Default required interactions should be derived from the requested tool. For Prompt Compiler Lab-style tools, useful interactions include:

```text
Generate or Compile updates output.
Copy copies or selects output.
GPT/Claude mode changes output shape or target label.
Secret-like input is emitted as [REDACTED_SECRET] only when redaction is in scope.
```

Prompt snippet:

```text
Before final answer, verify:
- The page visibly contains: [required sections].
- The page includes: [required interactions].
- The page does not include: React, Vue, Next.js, CDN framework dependencies.
- The page includes responsive CSS.
- If secret-like input is handled, output uses [REDACTED_SECRET].

If any item is missing, revise before final.
```

Autonomy budget:

```text
You may add small expected product controls such as Copy, Tighten, Example, Clear, tabs, mode switch, or local preview if they improve usability and do not violate the single-file/no-framework scope.
```

## Code Change Gate

Use for repo edits, bug fixes, refactors, tests, and automation scripts.

```text
Hard validator:
- Only allowed files are changed.
- The original behavior/request is directly addressed.
- Existing public contracts are preserved unless explicitly changed.
- Relevant tests, linters, type checks, or focused commands are run.
- Verification output is reported with command and result.

Self-repair gate:
If verification fails and the cause is in scope, fix and rerun once.
If verification cannot run, state why and provide the strongest alternative evidence.
```

## Prompt Lint Gate

Use when improving or reviewing a prompt.

```text
Hard validator:
- Objective is explicit.
- Input boundaries are explicit.
- Output contract is explicit.
- Validator is concrete enough for a human, parser, test, or rubric.
- Target model adapter does not change the user's intent.

Self-repair gate:
If clarity, boundary, output_contract, or validator fails the pass line, revise the prompt before presenting the final improved version.
```

## Model Adapter Gate

Use when emitting GPT/OpenAI or Claude variants.

```text
Hard validator:
- Prompt IR is model-neutral.
- GPT/OpenAI version uses Markdown sections or API role separation.
- Claude version uses XML-style tags when boundaries matter.
- Untrusted data is marked as data, not instructions.
- Output format is parseable or reviewable.
- Stop rule is explicit.

Self-repair gate:
Compare adapters against the same Prompt IR. If a target version drops a required constraint, restore it before final output.
```

## Research Summary Gate

Use for claims about external facts, tools, official docs, prices, laws, or current capabilities.

```text
Hard validator:
- Claims are separated from inference.
- Source/evidence is attached to important claims.
- Missing or unverified evidence is labeled.
- Current/unstable facts are verified with appropriate sources before being presented as current.

Self-repair gate:
If a claim lacks evidence, either fetch/inspect evidence when allowed or downgrade it to "unverified".
```

## Writing Artifact Gate

Use for essays, plans, reports, tutorials, launch copy, and reusable docs.

```text
Hard validator:
- Audience is named.
- Purpose is named.
- Required sections are present.
- Tone and language match the user request.
- Unsupported factual claims are avoided or labeled.
- The output is usable without rereading the messy source.
```

## Agent Handoff Gate

Use when preparing another model/agent to execute work.

```text
Hard validator:
- Goal is explicit.
- Allowed scope is explicit.
- Do-not-touch scope is explicit.
- Read-first inputs are listed or marked unknown.
- Evidence required is explicit.
- Verification command/artifact is explicit.
- Stop rule is explicit.

Self-repair gate:
If any handoff field is missing, fill it from known context or mark it under Unknowns before final.
```
