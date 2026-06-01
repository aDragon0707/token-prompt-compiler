# Runtime Brief: token-prompt-compiler

Use for messy, vague, broad, long, or handoff-bound requests. Skip full packets for small clear coding tasks.

Core job: compile human language into the smallest useful machine task packet:

```text
goal -> scope -> inputs -> actions -> evidence -> verification -> stop rule
```

For prompt optimization, compile messy requests into Prompt IR first; emit GPT/OpenAI or Claude adapters only when model-specific execution matters.

Scale gate:

```text
Small -> no packet; execute with karpathy-skill.
Medium -> Tiny Packet.
Large -> Standard/Full Packet or Worker Packet.
```

Compile-only means compile-only. If the user asks for a prompt, task packet, rewrite, or scope clarification, do not inspect the repo, read files, run tools, or output tool calls unless explicitly asked to execute. Missing context goes under `Unknowns` or `Stop rule`.

Tiny Packet:

```text
Goal:
Scope:
Do:
Do not:
Evidence:
Verify:
Stop if:
```

Prefer paths, receipts, facts, and one verification command over broad context.
