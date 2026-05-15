# Related Work Notes

Token Prompt Compiler is a pre-spec prompt compilation layer.

## Anthropic Agent Skills

Agent Skills are useful because the skill body is loaded only when relevant. This supports the design choice of keeping durable instructions in a skill instead of stuffing every instruction into a global prompt.

What to borrow:

- progressive disclosure
- concise `SKILL.md`
- optional references loaded only when needed
- scripts/assets only when they reduce repeated work

## Spec-Driven Development Skills

Spec-driven development turns a feature idea into requirements, design, plans, and implementation steps.

Token Prompt Compiler sits earlier:

```text
messy human language -> compact task packet -> spec workflow
```

What to borrow:

- requirements extraction
- validation checklist
- implementation plan handoff

What to avoid:

- overbuilding a full spec when the user only needs a small task packet

## Token Usage Auditors

Token auditors measure the run after it happens. They identify expensive calls, repeated tool schemas, cache misses, and unnecessary context.

Token Prompt Compiler reduces waste before the run:

```text
scope control
read-first limits
tool-output summaries
stop rules
adapter notes
```

Best loop:

```text
compile -> execute -> measure -> update packet pattern
```

## Local Adjacent Skills

Useful adjacent patterns:

- `audit-evolution`: clean-state packet and token-light audit.
- `signal-to-ship`: noisy input to decision/action/workflow.
- `doc-memory-spine`: evidence boundaries and memory governance.

Token Prompt Compiler remains distinct because its primary job is:

```text
human language -> machine-readable task packet
```

