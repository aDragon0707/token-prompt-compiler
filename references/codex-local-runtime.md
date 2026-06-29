# Codex Local Runtime

Use this reference for local token/cost strategy, broad context continuation, prompt caching, Micro Receipt, Evidence Receipt, and long tool-output compression.

## Default Order

```text
1. Direct execution for small scoped tasks
2. Micro Receipt when continuing from prior work
3. Tiny Packet by default for messy medium tasks
4. Standard Packet only when evidence or output shape matters
5. Full Packet only for multi-file/tool/safety/worker tasks
6. Full logs stay on disk; prompt gets paths, facts, numbers, and next action
```

## Micro Receipt

Use when continuing from prior work and the next decision only needs compact state.

```text
Micro Receipt
Goal:
Known facts:
Decision boundary:
Next action:
Stop if:
Full logs:
```

## Evidence Receipt

Use when source context is large and the next agent only needs a compact evidence ledger.

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

## Local Runtime Rules

- Do not reread full history when a receipt or result file exists.
- Prefer `rg`, targeted file reads, and result JSON summaries over broad scans.
- Keep progress updates short; save long evidence to files.
- Avoid rigid line/character constraints unless a downstream parser requires them.
- Do not trust visible brevity; token/cost claims need provider usage or measured cost.
- If a task is small and already scoped, skip Full Packet and use Tiny Packet or direct execution.
- If context is broad, first create or update a receipt, then reason from the receipt.
- If the user asked only for a packet, do not gather more context. Put missing context under `Unknowns` or `Stop rule`.

## Cache Vs Receipt

- Cache hit makes repeated long context cheaper; Micro Receipt avoids sending long context.
- Prefer stable short prefix + Micro Receipt + dynamic task tail.
- Do not treat high cache-read tokens as proof of good context design.
- If usage is visible, compare cached full-context cost against receipt-based cost.

## Token Policy Defaults

```text
static_prefix: reuse stable rules, schemas, and project memory by reference
dynamic_task: keep to the current task only
evidence_tail: include only latest relevant evidence
tool_output: summarize and reference full logs by path
model_policy: cheap model for extraction, strong model for final judgment
reasoning_policy: use high reasoning only for ambiguity, architecture, safety, or verification
```
