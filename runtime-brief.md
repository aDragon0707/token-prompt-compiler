# Runtime Brief: token-prompt-compiler

Use for messy, vague, broad, long, or handoff-bound requests. Skip full packets for small clear coding tasks.

Core job: compile human language into the smallest useful SACP task contract:

```text
objective -> boundaries -> inputs -> output -> validator -> repair -> stop rule
```

For prompt optimization, compile messy requests into SACP first; emit Prompt IR or GPT/OpenAI/Claude adapters only when model-specific execution matters. For artifact or execution tasks, include an autonomy budget, hard validator, executable validator spec, and self-repair gate.

Scale gate:

```text
Small -> no packet; execute with karpathy-skill.
Medium -> Tiny Packet.
Large -> Standard/Full Packet or Worker Packet.
```

Compile-only means compile-only. If the user asks for a prompt, task packet, rewrite, or scope clarification, do not inspect the repo, read files, run tools, or output tool calls unless explicitly asked to execute. Missing context goes under `Unknowns` or `Stop rule`.

Tiny Packet:

```text
Tiny SACP
sacp_version: 0.1
Objective:
Boundary:
Output:
Validator:
Stop if:
```

Prefer paths, receipts, facts, and one verification command over broad context.
