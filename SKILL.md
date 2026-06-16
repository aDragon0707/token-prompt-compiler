---
name: token-prompt-compiler
description: Use when a user asks to compile messy requests, optimize or review prompts, reduce context/token waste, create SACP task contracts, adapt prompts for GPT/OpenAI or Claude, prepare agent handoff packets, define validators, or benchmark token/cost claims.
---

# Token Prompt Compiler

## Core Rule

Before executing a broad or messy request, compile it into the smallest useful SACP task contract, Prompt IR, or machine-readable packet that preserves intent, boundaries, evidence needs, output contract, validation, repair behavior, and stop conditions.

Do not merely shorten the user's words. Preserve the decision surface:

```text
objective -> boundaries -> inputs -> output -> validator -> repair -> stop rule
```

The main token-saving mechanism is context control, not prettier formatting. Keep full logs, long documents, and broad history on disk; feed the model only a compact evidence receipt, the current task, and the minimum rules needed for the decision.

This skill is the pre-spec layer: compile human language before sending work to spec-driven development, TDD, implementation, review, or multi-agent workers. SACP is the protocol skeleton; Prompt IR is the model-neutral representation; GPT/OpenAI or Claude prompts are adapter outputs.

## Intent Gate

First classify the user's intent. The skill name only selects this capability; it does not provide the task material, execution mode, or desired output.

| User intent | Default action |
|---|---|
| Bare invocation: user only says `use token-prompt-compiler`, `使用 token-prompt-compiler`, or similar | Ask one concise question for `task material + mode + desired output`; do not invent a task. |
| `compile-only`, prompt rewrite, task packet, or scope clarification | Return the smallest useful SACP or Prompt Lint output; do not inspect files or execute tools unless explicitly requested. |
| Compile then execute | Compile first only when it changes the next action materially, then execute within the compiled boundaries. |
| `prompt_lint`, optimize/review/fix a prompt | Score the prompt, repair critical gaps, and run the Prompt Quality Gate before final output. |
| `model_adapter`, GPT/OpenAI version, Claude version | Keep one SACP/Prompt IR source of truth, then emit model-specific variants. |
| Benchmark, token saving, cost proof, A/B test | Produce fixed conditions and measurement fields; do not claim token savings without provider usage evidence. |

## Reference Router

Load only the references needed for the chosen intent. Do not batch-read `references/`.

| Need | Read |
|---|---|
| SACP fields, tiers, Prompt IR mapping, anti-patterns | `references/sacp-core.md` |
| Prompt IR fields or model-neutral intermediate representation | `references/prompt-ir-schema.md` |
| Prompt scoring, lint thresholds, quality repair | `references/lint-rubric.md` |
| Prompt reflection policy and final prompt quality gate | `references/prompt-quality-gate.md` |
| GPT/OpenAI, Claude, Gemini, DeepSeek, or OpenAI Agents adaptation | `references/adapters.md` |
| Task-type validator defaults | `references/task-adapters.md` |
| Hard validators and self-repair templates | `references/validator-gates.md` |
| No-dependency executable validator specs | `references/executable-validator-spec.md` |
| Optional official optimizer/eval/tool boundaries | `references/official-tools.md` |
| Token/cost A/B protocol or benchmark claim boundary | `references/ab-test.md` |

## Scale Gate

Compile only as much as the task needs:

```text
Small: already scoped, one clear action -> no packet; execute with karpathy-skill.
Medium: some ambiguity, several files, or handoff risk -> Tiny Packet.
Large: multi-agent, long context, safety risk, or external deliverable -> Standard/Full Packet.
```

If a packet does not change the next action, skip the packet and execute.

Friction check:

- Before emitting Standard/Full SACP, ask whether the packet adds more coordination steps than it removes ambiguity.
- For small single-file, plan-only, read-only, or already-bounded tasks, output one lean prompt or Tiny SACP at most.
- Do not create multi-window, multi-reviewer, phase-gated workflows unless the task has real cross-file, privacy, external-publish, API, schema, or multi-agent handoff risk.
- If the user asks to optimize a prompt for a small task, preserve the user's intended path and compress it; do not invent governance roles or extra approval stages.

Compile-only means compile-only: when the user asks for a prompt, task packet, rewrite, or scope clarification, do not inspect the repo, read files, run tools, or output tool calls unless the user explicitly asks you to execute. Work only from the provided request and any provided artifacts.

Plan Escalation Rule:

- Do not use Plan Mode for compile-only, simple prompt rewrites, or one-off `prompt_lint`.
- Use Plan Mode for complex repo execution, PR/merge work, real API calls or costs, multi-agent handoffs, destructive risk, unclear ownership, or high-risk execution where the implementation path needs agreement.

## SACP Compiler Rule

Use SACP when the user asks to optimize, review, normalize, adapt, or compile a prompt, or when the request is messy enough that the target model would need clearer boundaries, validators, or stop rules.

Default pipeline:

```text
messy request -> minimal SACP -> optional Prompt IR -> optional model/task adapter -> validator -> Prompt Quality Gate -> self-repair gate
```

Do not call official prompt optimization APIs by default. If the user asks to use OpenAI, Anthropic, Vertex, GitHub Models, or another official optimizer, explain the optional adapter boundary and required credentials/approval instead of silently using external services.

Read as needed:

- `references/sacp-core.md`: SACP v0.1 fields, Tiny/Standard/Full tiers, and anti-patterns.
- `references/prompt-ir-schema.md`: Prompt IR fields, required core, optional enrichments.
- `references/lint-rubric.md`: prompt lint scoring and pass thresholds.
- `references/prompt-quality-gate.md`: reflection_policy, skip/light/full selection, and final prompt repair.
- `references/adapters.md`: GPT/OpenAI and Claude dialect adapters; other model stubs.
- `references/task-adapters.md`: task-type validators for web artifacts, code, research, writing, and handoffs.
- `references/validator-gates.md`: task-type validators and self-repair gates.
- `references/executable-validator-spec.md`: validator specs and no-dependency Node.js script templates.
- `references/official-tools.md`: official optimizer/eval/tool boundary map.

## Preserve Useful Autonomy

For open-ended artifact or product tasks, do not over-specify away the model's useful judgment. Lock the risks and leave small improvements open.

```text
Hard locks: scope, files, dependencies, required visible sections, required outputs, safety boundaries, validation command.
Autonomy budget: allow small expected controls, polish, examples, cleanup, or local checks if they improve usability and do not violate scope.
```

If the task has artifact risk, compile requirements into `hard_validator`, `validator_spec`, and `self_repair_gate`, but also include an `autonomy_budget` so the worker can use sensible judgment inside the contract.

## Prompt Quality Gate

Use `reflection_policy` only to improve the generated prompt or packet; do not use it to start doing the user's downstream task.

```text
skip: simple one-off prompt where SACP fields are already clear.
light: normal prompt optimization; check objective, boundary, output contract, validator, and stop rule once.
full: reusable prompt, worker handoff, multi-model adapter, compile-then-execute, benchmark claim, or high-risk execution.
```

Return the repaired prompt or packet, not a long hidden-thought-style reflection. If the final prompt still lacks task material, execution mode, or output contract, ask one concise question instead of guessing.

## Codex Local Cost Rules

When Codex uses this skill locally, default to this order:

```text
1. Direct execution for small scoped tasks
2. Micro Receipt when continuing from prior work
3. Tiny Packet by default for messy medium tasks
4. Standard Packet only when evidence or output shape matters
5. Full Packet only for multi-file/tool/safety/worker tasks
6. Full logs stay on disk; prompt gets paths, facts, numbers, and next action
```

Use this Micro Receipt when continuing work:

```text
Micro Receipt
Goal:
Known facts:
Decision boundary:
Next action:
Stop if:
Full logs:
```

Use Evidence Receipt when source context is large and the next agent only needs a compact evidence ledger:

```text
Evidence Receipt
Task:
Sources checked:
Facts:
Missing evidence:
Decision boundary:
Next test:
Full logs:
```

Local runtime rules:

- Do not reread full history when a receipt or result file exists.
- Prefer `rg`, targeted file reads, and result JSON summaries over broad scans.
- Keep progress updates short; save long evidence to files.
- Avoid rigid line/character constraints unless a downstream parser requires them.
- Do not trust visible brevity; token/cost claims need provider usage or measured cost.
- If a task is small and already scoped, skip Full Packet and use Tiny Packet or direct execution.
- If context is broad, first create or update a receipt, then reason from the receipt.
- If the user asked only for a packet, do not gather more context. Put missing context under `Unknowns` or `Stop rule`.

Cache vs receipt rule:

- Cache hit makes repeated long context cheaper; Micro Receipt avoids sending long context.
- Prefer stable short prefix + Micro Receipt + dynamic task tail.
- Do not treat high cache-read tokens as proof of good context design.
- If usage is visible, compare cached full-context cost against receipt-based cost.

## Router Handoff

If the task is mainly about model choice, provider choice, token/cost strategy, prompt caching, probes, or deciding which skill should run, let `agent-cost-router` decide the route first.

When called by `agent-cost-router`, obey the route instead of re-routing:

```text
inputs from router: goal, scope, evidence_budget, packet_tier, stop_rule
output: Tiny Packet, Standard Packet, Worker Packet, Evidence Receipt, or Micro Receipt
do not output: model routing analysis, provider pricing strategy, post-task audit
```

After execution, leave continuity and score/cost deltas to `audit-evolution`.

## Karpathy Handoff

Every executable packet should make the implementation discipline obvious:

```text
Assumptions:
Allowed edits:
Do not touch:
Success criteria:
Verification:
Stop rule:
```

Prefer one precise verification command or artifact over a broad checklist.

## Compilation Workflow

1. Extract intent.
   - Identify the real job, not every sentence.
   - Separate immediate task from long-term strategy.
   - Mark vague desires as assumptions, not instructions.

2. Set boundaries.
   - Name allowed files, URLs, tools, and time horizon when known.
   - Name forbidden or out-of-scope work.
   - If boundaries are missing, choose conservative defaults instead of expanding.
   - Ask at most one question if a missing boundary can cause destructive work or a wrong deliverable.

3. Minimize context.
   - Prefer paths, receipts, summaries, and source maps over full history.
   - Read at most 3-5 starting files unless the task explicitly requires more.
   - Convert long logs or webpages into references plus excerpts.

4. Define verification.
   - Include commands, expected artifacts, or evidence fields.
   - Require test exit code, diff summary, source URL, file path, or screenshot hash when relevant.
   - For artifact or execution tasks, add `hard_validator`, `validator_spec`, and `self_repair_gate`, not just a soft checklist.

5. Add a stop rule.
   - Stop when evidence is missing, scope expands, two attempts fail, or the task needs a human decision.

6. Choose an execution path.
   - `prompt_only`: return the packet only.
   - `execute_now`: execute from the packet.
   - `worker_packet`: prepare for another agent/model.
   - `evidence_receipt`: compress broad context into a short evidence ledger before final judgment.
   - `ab_test`: produce A/B variants and measurement fields.
   - `prompt_lint`: score and improve an existing prompt without executing it.
   - `model_adapter`: emit GPT/OpenAI and/or Claude variants from Prompt IR.

## Output Shape

When the user asks for a contract, packet, or prompt rewrite, output the smallest useful SACP tier.

Use Tiny SACP for small or already-scoped tasks:

```text
Tiny SACP
sacp_version: 0.1
Objective:
Boundary:
Output:
Validator:
Stop if:
```

Use Standard SACP for most prompt optimization, handoff, artifact, and medium ambiguity tasks:

```text
Standard SACP
sacp_version: 0.1
Objective:
Inputs:
Input boundaries:
Constraints:
Output contract:
Validator:
Repair policy:
Autonomy budget:
Stop rule:
```

When the user asks to execute after compiling, first show the packet only if it changes the task materially; otherwise execute from the packet.

When the user asks for a packet only, never output `<bash>`, tool calls, repo scans, or "let me inspect" preambles. The deliverable is the SACP contract or packet.

Use this legacy packet shape only when the user explicitly asks for a Machine Task Packet:

```text
Machine Task Packet
Goal:
Allowed scope:
Inputs:
Actions:
Evidence required:
Verification:
Output format:
Stop rule:
Adapter notes:
```

When the user asks to optimize, review, or fix a prompt, output this unless they request a full packet:

```text
Prompt Lint
Scores:
Critical gaps:
SACP:
Prompt IR: optional, only when useful
Reflection policy:
Improved prompt:
Hard validator:
Validator spec:
Validation script:
Self-repair gate:
Adapter notes:
```

For artifact-building prompt lint, include both `prompt_lint_score` and `artifact_quality_score`. Do not let clean wording hide a weak artifact validator.

When the user asks for GPT/OpenAI or Claude variants, output:

```text
SACP:
Prompt IR: optional, only when useful
Reflection policy:
GPT/OpenAI version:
Claude version:
Hard validator:
Validator spec:
Validation script:
Self-repair gate:
Known tradeoffs:
```

When the user asks to optimize a webpage/tool-building prompt, use this static artifact shape:

```text
SACP:
- task_type: static_web_artifact
- objective:
- inputs:
- input_boundaries:
- output_contract:
- hard_validator:
- validator_spec:
- self_repair_gate:
- autonomy_budget:

GPT/OpenAI version:
Claude version:
Validation script:
Known tradeoffs:
```

For `static_web_artifact`, derive required visible strings and interactions from the user's task. Make `Validation script` a no-dependency Node.js checker by default unless the user asks for another runtime. Do not default every webpage to Prompt Compiler Lab, GPT/Claude sections, or secret redaction unless the task calls for them.

## Adapter Notes

Use the same Prompt IR or packet across models, but tune the adapter note. For detailed GPT/OpenAI and Claude dialects, read `references/adapters.md`.

```text
Codex: prefer file paths, commands, diffs, tests, receipts, and strict edit scope.
Claude Code: prefer worktree boundaries, subagent roles, hooks, and stop conditions.
Gemini CLI: prefer explicit file scope, structured output, and grounding requirements.
DeepSeek: prefer stable prefix first, JSON mode when parsing matters, and cache-hit friendly repeated instructions.
OpenAI Agents: prefer tools, handoffs, trace/eval fields, and structured outputs.
```

## A/B Test Mode

When the user asks to test token reduction, output:

```text
A: original prompt
B: compiled packet
Fixed conditions:
Metrics: input_tokens, cached_tokens, output_tokens, reasoning_tokens, tool_calls, retries, task_passed, quality_score
Pass rule: >=25% total token reduction, quality_delta >= -1, task_passed=true
```

See `references/ab-test.md` for the fuller measurement protocol.

## Token Policy

Use these defaults:

```text
static_prefix: reuse stable rules, schemas, and project memory by reference
dynamic_task: keep to the current task only
evidence_tail: include only latest relevant evidence
tool_output: summarize and reference full logs by path
model_policy: cheap model for extraction, strong model for final judgment
reasoning_policy: use high reasoning only for ambiguity, architecture, safety, or verification
```

## Rewrite Patterns

Messy:

```text
Help me look at these materials, organize them, and think about what to do next.
```

Compiled:

```text
Goal: Review the provided materials and produce a decision memo.
Allowed scope: Only the provided files/links.
Actions: Extract 5 useful signals, 3 risks, 3 next actions.
Evidence required: Cite file paths/URLs for each signal.
Output format: Chinese memo under 800 words.
Stop rule: Stop if required sources are unavailable.
```

Messy:

```text
Optimize this project. Do not mess it up. Make it look better and more professional.
```

Compiled:

```text
Goal: Improve the visible UI polish without changing product behavior.
Allowed scope: Frontend files for the current page only.
Read first: Main HTML/CSS/component entry points.
Actions: Fix layout, spacing, hierarchy, responsive overflow.
Verification: Browser screenshot at desktop and mobile widths.
Output format: Changed files, visual checks, remaining risks.
Stop rule: Stop before backend/data model changes.
```

## Quality Bar

A good compiled prompt is:

- shorter than the original when the original is noisy;
- more specific than the original when the original is vague;
- explicit about what evidence proves completion;
- explicit about what not to do;
- usable by another agent without rereading the whole conversation.

## References

Load only when needed:

- `references/sacp-core.md`: SACP field semantics, tiers, Prompt IR mapping, and anti-patterns.
- `references/prompt-ir-schema.md`: Prompt IR field semantics, required core, and optional enrichments.
- `references/lint-rubric.md`: scoring prompts for clarity, boundaries, output contract, validator, token efficiency, and model fit.
- `references/prompt-quality-gate.md`: skip/light/full prompt reflection policy and final prompt repair.
- `references/spec.md`: full packet spec and field semantics.
- `references/adapters.md`: model-specific adapter notes.
- `references/task-adapters.md`: task-type validators and adapter defaults without overfitting to one example.
- `references/validator-gates.md`: hard validator and self-repair templates by task type.
- `references/executable-validator-spec.md`: executable validator spec fields and static web script template.
- `references/official-tools.md`: optional official optimizer/eval/tool boundary map; do not call external services by default.
- `references/ab-test.md`: token reduction measurement protocol.
- `references/related-work.md`: positioning against similar skills and workflows.
