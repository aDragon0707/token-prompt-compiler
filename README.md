# Token Prompt Compiler

**English** | **中文**

Token Prompt Compiler turns messy human-language requests into compact, bounded task contracts for LLMs and AI agents.

Think of it as a pre-flight contract:

```text
Before the model starts working, define the objective, boundaries, inputs,
output contract, validator, repair policy, and stop rules.
```

## Why This Exists

Human prompts are often full of mixed intent:

- vague goals;
- hidden constraints;
- missing inputs;
- unclear output shape;
- no validation rule;
- no stop condition.

Agents then waste context, overclaim completion, or optimize for the wrong thing. Token Prompt Compiler compresses messy intent into a contract that another agent can execute and audit.

## 30-Second Quick Start

Paste this into Codex, Claude Code, ChatGPT, Gemini, DeepSeek, or another agent:

```text
Use token-prompt-compiler to compile this request into a minimal SACP task contract, then execute it:

[your messy request]
```

For prompt optimization only:

```text
Use token-prompt-compiler to turn this request into:
- a compact task contract
- GPT/OpenAI prompt
- Claude prompt
- hard validator
- repair policy

[your messy request]
```

## Before / After

Before:

```text
Help me improve my GitHub, make it look better, maybe use some awesome README examples.
```

After:

```yaml
objective: Produce local-only GitHub profile and README renovation drafts.
scope:
  include: profile README, 5 core repositories, reusable skill draft
  exclude: remote GitHub writes, PR creation, account actions
output_contract:
  - audit markdown
  - profile README draft
  - repository README drafts
  - skill draft
validator: all files exist, links are inspectable, no credential output, no remote mutation
stop_rules:
  - ask before publishing
  - mark blocked if public data is unavailable
```

## How It Connects To SACP

Token Prompt Compiler prepares the task. SACP audits the work after or during execution.

```text
Messy intent -> task contract -> agent execution -> SACP receipt -> review
```

Related projects:

- [SACP](https://github.com/aDragon0707/sacp): auditable work receipt protocol
- [Solo-AI-Company-OS](https://github.com/aDragon0707/Solo-AI-Company-OS): operating memory for task records and handoffs
- [Agent Flight Recorder](https://github.com/aDragon0707/audit-evolution-agent-flight-recorder): evidence and evolution loop

## What It Produces

- SACP-style task contracts
- Prompt IR
- model-specific prompt variants
- autonomy budgets
- validator specs
- repair policies
- stop rules
- worker handoff packets

## Status

This project is usable as a Codex skill and as a model-agnostic prompting pattern. Treat it as a practical compiler for agent work instructions, not as a replacement for human review.

## Roadmap

- add more before/after prompt examples;
- tighten task contract schema examples;
- add validator examples for common task types;
- document failure cases where compilation should stop and ask the human.

## License

MIT.
