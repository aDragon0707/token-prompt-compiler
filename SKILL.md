---
name: token-prompt-compiler
description: Convert messy human-language requests, long reflections, strategy notes, or vague asks into token-efficient machine-readable task packets for Codex, Claude Code, Gemini CLI, OpenAI Agents, DeepSeek, and other LLM/agent systems. Use when the user asks to save tokens, reduce token use, rewrite a request as a better prompt, turn human words into an agent-friendly prompt, create a task packet, clarify scope, prepare worker prompts, or avoid agent drift while still completing work well.
---

# Token Prompt Compiler

## Core Rule

Before executing a broad or messy request, compile it into the smallest machine-readable task packet that preserves intent, evidence needs, and acceptance criteria.

Do not merely shorten the user's words. Preserve the decision surface:

```text
goal -> scope -> inputs -> actions -> evidence -> verification -> stop rule
```

The main token-saving mechanism is context control, not prettier formatting. Keep full logs, long documents, and broad history on disk; feed the model only a compact evidence receipt, the current task, and the minimum rules needed for the decision.

This skill is the pre-spec layer: compile human language before sending work to spec-driven development, TDD, implementation, review, or multi-agent workers.

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

5. Add a stop rule.
   - Stop when evidence is missing, scope expands, two attempts fail, or the task needs a human decision.

6. Choose an execution path.
   - `prompt_only`: return the packet only.
   - `execute_now`: execute from the packet.
   - `worker_packet`: prepare for another agent/model.
   - `ab_test`: produce A/B variants and measurement fields.
   - `evidence_receipt`: compress broad context into a short evidence ledger before final judgment.

## Packet Tiers

Use the smallest tier that can pass verification:

```text
Tiny Packet:
Goal:
Actions:
Stop rule:
```

Use Tiny Packet for single-file, already-scoped, low-risk tasks.

```text
Standard Packet:
Goal:
Allowed scope:
Actions:
Evidence required:
Output format:
Stop rule:
```

Use Standard Packet for most reviews, small implementation tasks, and handoffs.

```text
Full Packet:
Goal:
Why now:
Allowed scope:
Read first:
Do not touch:
Actions:
Evidence required:
Verification:
Output format:
Stop rule:
Token policy:
Adapter notes:
```

Use Full Packet only when ambiguity, multiple files, tools, workers, safety, or verification justify the extra input tokens.

## Evidence Receipt

When the source context is large, create a short receipt instead of passing the whole context forward:

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

Rules:

- Full logs and raw outputs stay on disk.
- The model sees paths, hashes, exit codes, key excerpts, and short findings.
- Quality score and token saving stay separate.
- Judge total provider cost, not visible answer length or prompt length alone.
- Remember that task packets may increase input tokens on small tasks.

Use a Micro Receipt when the next task only needs a claim boundary or final decision:

```text
Micro Receipt
Task:
Facts:
Rules:
Claim:
Next:
```

Micro Receipt works best when the full evidence has already been audited and saved elsewhere. Include exact numbers only when they change the decision.

## Runtime Cost Controls

For local CLI runners and agent shells, the wrapper can cost more than the task. Prefer:

```text
minimal_runtime: bare/minimal mode when available
fixed_model: avoid automatic multi-model routing during measurement
micro_receipt: pass only facts needed for the next decision
loose_short_output: ask for short bullets, not rigid per-line character math
no_meta: no word counts, no explanations of compliance, no postscript
```

Avoid over-constraining output with many exact string, line, or character requirements. In local tests, visible output could shrink while provider `output_tokens` and total cost rose.

## Cache vs Receipt Rule

Prompt caching and receipts solve different problems:

```text
cache_hit: makes repeated long prefixes cheaper
micro_receipt: avoids sending the long prefix at all
```

Decision rule:

- If the long context is stable and must remain active, put stable rules first so cache can hit.
- If the next decision only needs facts, replace the long context with a Micro Receipt.
- Best case: stable short prefix + Micro Receipt + dynamic task tail.
- Do not treat high cache-read tokens as proof of good context design; it may only mean an oversized prompt became cheaper, not small.
- Report both `cached_tokens` and uncached/dynamic tokens when usage is available.

## Output Shape

When the user asks for a prompt only, output this:

```text
Machine Task Packet
Goal:
Why now:
Allowed scope:
Read first:
Do not touch:
Actions:
Evidence required:
Verification:
Output format:
Stop rule:
Token policy:
Adapter notes:
```

When the user asks to execute after compiling, first show the packet only if it changes the task materially; otherwise execute from the packet.

## Adapter Notes

Use the same packet across models, but tune the adapter note:

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

For context-saving tests, compare:

```text
A: broad context / full documents / full logs
B: compact evidence receipt + minimum packet + referenced full logs on disk
```

This tests the real savings mechanism: fewer irrelevant input tokens, shorter required output, fewer retries, and fewer tool calls.

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
packet_tier: tiny by default, standard when evidence/format matters, full only when justified
receipt_tier: evidence receipt for broad context, micro receipt for final claim/decision
cache_policy: stable short prefix first, dynamic task last, but prefer receipt over huge cached context
claim_policy: do not claim token savings unless provider usage or cost verifies it
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

- `references/spec.md`: full packet spec and field semantics.
- `references/adapters.md`: model-specific adapter notes.
- `references/ab-test.md`: token reduction measurement protocol.
- `references/related-work.md`: positioning against similar skills and workflows.
