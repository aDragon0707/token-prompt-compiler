---
name: token-prompt-compiler
description: Use when a user asks to compile messy requests, optimize or review prompts, reduce context/token waste, create SACP task contracts, adapt prompts for GPT/OpenAI or Claude, prepare agent handoff packets, define validators, or benchmark token/cost claims.
---

# Token Prompt Compiler

## Core Rule

Before executing a broad or messy request, compile it into the smallest useful SACP task contract, Prompt IR, or machine-readable packet that preserves:

```text
objective -> boundaries -> inputs -> output -> validator -> repair -> stop rule
```

Do not merely shorten the user's words. The main token-saving mechanism is context control: keep full logs, long documents, and broad history on disk; feed the model only compact receipts, current task facts, and the minimum rules needed for the decision.

This is a pre-spec layer. SACP is the protocol skeleton, Prompt IR is the model-neutral representation, and GPT/OpenAI or Claude prompts are adapter outputs.

## Intent Gate

First classify the user's intent. The skill name selects this capability; it does not provide task material, execution mode, or desired output.

| User intent | Default action |
|---|---|
| Bare invocation: user only says `use token-prompt-compiler`, `使用 token-prompt-compiler`, or similar | Ask one concise question for `task material + mode + desired output`; do not invent a task. |
| `compile-only`, prompt rewrite, task packet, or scope clarification | Return the smallest useful SACP or Prompt Lint output; do not inspect files or execute tools unless explicitly requested. |
| Compile then execute | Compile only enough to clarify scope and validation, then execute within the compiled boundaries. |
| `prompt_lint`, optimize/review/fix a prompt | Score the prompt, repair critical gaps, and run the Prompt Quality Gate before final output. |
| `model_adapter`, GPT/OpenAI version, Claude version | Keep one SACP or Prompt IR source of truth, then emit model-specific variants. |
| Benchmark, token saving, cost proof, A/B test | Produce fixed conditions and measurement fields; do not claim token savings without provider usage evidence. |

## When Not To Use

Do not use this skill for ordinary code review, PR review, bug fixing, test failure debugging, UI/product design, PRD/issue planning, or runtime performance benchmarking unless the user explicitly asks to compile a prompt, SACP, handoff packet, validator, or token/cost benchmark.

For a single exact edit, direct question, already-scoped command, or normal implementation task, use the host agent's normal workflow or a more specific skill.

## Reference Router

Load only the references needed for the chosen intent. Do not batch-read `references/`.

| Need | Read |
|---|---|
| SACP fields, tiers, Prompt IR mapping, anti-patterns | `references/sacp-core.md` |
| Exact Tiny/Standard SACP, Prompt Lint, model adapter, static artifact, legacy packet, or A/B output shapes | `references/output-shapes.md` |
| Prompt IR fields or model-neutral intermediate representation | `references/prompt-ir-schema.md` |
| Prompt scoring, lint thresholds, quality repair | `references/lint-rubric.md` |
| Prompt reflection policy and final prompt quality gate | `references/prompt-quality-gate.md` |
| GPT/OpenAI, Claude, Gemini, DeepSeek, or OpenAI Agents adaptation | `references/adapters.md` |
| Task-type validator defaults | `references/task-adapters.md` |
| Hard validators and self-repair templates | `references/validator-gates.md` |
| No-dependency executable validator specs | `references/executable-validator-spec.md` |
| Codex local receipts, cache-vs-receipt, broad context continuation, or local token policy | `references/codex-local-runtime.md` |
| Optional official optimizer/eval/tool boundaries | `references/official-tools.md` |
| Token/cost A/B protocol or benchmark claim boundary | `references/ab-test.md` |
| API-level A/B runner, provider usage fields, shared evidence, or result schema | `references/api-ab-test.md` |

## Scale Gate

Compile only as much as the task needs:

```text
Small: already scoped, one clear action -> no packet; execute directly with the host agent's normal discipline.
Medium: some ambiguity, several files, or handoff risk -> Tiny Packet.
Large: multi-agent, long context, safety risk, or external deliverable -> Standard/Full Packet.
```

If a packet does not change the next action, skip the packet and execute. For small scoped tasks, skip Full Packet. For small single-file, plan-only, read-only, or already-bounded tasks, output one lean prompt or Tiny SACP at most. Do not create multi-window, multi-reviewer, phase-gated workflows unless the task has real cross-file, privacy, external-publish, API, schema, or multi-agent handoff risk.

Compile-only means compile-only: work only from the provided request and artifacts. Do not inspect the repo, read files, run tools, or output tool calls unless the user explicitly asks you to execute.

Plan Escalation Rule:

- Do not use Plan Mode for compile-only, simple prompt rewrites, or one-off `prompt_lint`.
- Use Plan Mode for complex repo execution, PR/merge work, real API calls or costs, multi-agent handoffs, destructive risk, unclear ownership, or high-risk execution where the implementation path needs agreement.

## Compiler Workflow

1. Extract intent.
   - Identify the real job, not every sentence.
   - Separate immediate task from long-term strategy.
   - Mark vague desires as assumptions, not instructions.

2. Set boundaries.
   - Name allowed files, URLs, tools, and time horizon when known.
   - Name forbidden or out-of-scope work.
   - Ask at most one question if a missing boundary can cause destructive work or a wrong deliverable.

3. Minimize context.
   - Prefer paths, receipts, summaries, and source maps over full history.
   - Read at most 3-5 starting files unless the task explicitly requires more.
   - Convert long logs or webpages into references plus excerpts.

4. Define validation and repair.
   - Include commands, expected artifacts, source URLs, screenshots, or evidence fields.
   - For artifact or execution tasks, add `hard_validator`, `validator_spec`, and `self_repair_gate`, not just a soft checklist.
   - Stop when evidence is missing, scope expands, two attempts fail, or the task needs a human decision.

5. Choose the execution path.
   - `prompt_only`: return the packet only.
   - `execute_now`: execute from the packet.
   - `worker_packet`: prepare for another agent/model.
   - `evidence_receipt`: compress broad context into a short evidence ledger.
   - `ab_test`: produce A/B variants and measurement fields.
   - `prompt_lint`: score and improve an existing prompt without executing it.
   - `model_adapter`: emit GPT/OpenAI and/or Claude variants from Prompt IR.

## SACP Compiler Rule

Use SACP when the user asks to optimize, review, normalize, adapt, or compile a prompt, or when the request is messy enough that the target model would need clearer boundaries, validators, or stop rules.

Default pipeline:

```text
messy request -> minimal SACP -> optional Prompt IR -> optional model/task adapter -> validator -> Prompt Quality Gate -> self-repair gate
```

Do not call official prompt optimization APIs by default. If the user asks to use OpenAI, Anthropic, Vertex, GitHub Models, or another official optimizer, explain the optional adapter boundary and required credentials/approval instead of silently using external services.

## Preserve Useful Autonomy

For open-ended artifact or product tasks, do not over-specify away the model's useful judgment. Lock the risks and leave small improvements open.

```text
Hard locks: scope, files, dependencies, required visible sections, required outputs, safety boundaries, validation command.
Autonomy budget: allow small expected controls, polish, examples, cleanup, or local checks if they improve usability and do not violate scope.
```

## Prompt Quality Gate

Use `reflection_policy` only to improve the generated prompt or packet; do not use it to start doing the user's downstream task.

```text
skip: simple one-off prompt where SACP fields are already clear.
light: normal prompt optimization; check objective, boundary, output contract, validator, and stop rule once.
full: reusable prompt, worker handoff, multi-model adapter, compile-then-execute, benchmark claim, or high-risk execution.
```

Return the repaired prompt or packet, not a long hidden-thought-style reflection. If the final prompt still lacks task material, execution mode, or output contract, ask one concise question instead of guessing.

## Execution Handoff

Every executable packet should make implementation discipline obvious:

```text
Assumptions:
Allowed edits:
Do not touch:
Success criteria:
Verification:
Stop rule:
```

Prefer one precise verification command or artifact over a broad checklist. When the task is mainly about model choice, provider choice, token/cost strategy, prompt caching, probes, or deciding which skill should run, give a compact routing recommendation instead of silently invoking unavailable local skills.

## Output Rules

When the user asks for a contract, packet, prompt rewrite, model adapter, static artifact prompt, or A/B plan, output the smallest useful shape from `references/output-shapes.md`.

When the user asks to execute after compiling, first show the packet only if it changes the task materially; otherwise execute from the packet.

When the user asks for a packet only, never output `<bash>`, tool calls, repo scans, or "let me inspect" preambles. The deliverable is the SACP contract or packet.

Use the same Prompt IR or packet across models, but tune the adapter note. For detailed GPT/OpenAI and Claude dialects, read `references/adapters.md`.

## Token And Cost Policy

Token/cost claims require measured provider usage or a structured benchmark plan. Do not treat visible brevity, dry-runs, high cache-read tokens, or cleaner formatting as token-saving proof.

For local Micro Receipt, Evidence Receipt, cache-vs-receipt policy, and broad context continuation, read `references/codex-local-runtime.md`.

For token reduction tests, read `references/ab-test.md`. For API-level usage fields, shared evidence, provider result schema, and runner commands, read `references/api-ab-test.md`.

## Quality Bar

A good compiled prompt is:

- shorter than the original when the original is noisy;
- more specific than the original when the original is vague;
- explicit about what evidence proves completion;
- explicit about what not to do;
- usable by another agent without rereading the whole conversation.
