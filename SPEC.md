# Human-to-Machine Task Packet Spec

This project treats prompt writing as compilation:

```text
human language -> machine-readable task packet -> model/agent adapter -> execution -> receipt
```

## Packet Fields

```text
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

## Field Meanings

| Field | Purpose |
|---|---|
| Goal | The actual job to complete |
| Why now | The reason this task matters now |
| Allowed scope | Files, URLs, tools, or areas the model may use |
| Read first | The first 3-5 inputs to inspect |
| Do not touch | Boundaries that prevent drift |
| Actions | Ordered work steps |
| Evidence required | What proves claims or completion |
| Verification | Tests, checks, or review gates |
| Output format | Shape, language, and length |
| Stop rule | When the agent must stop or ask |
| Token policy | How to avoid wasted context |
| Adapter notes | Model-specific execution hints |

## Token Principle

The packet should minimize useless context while preserving:

```text
intent
scope
evidence
verification
handoff
```

Shorter is not always better. A good packet may add a few schema tokens to prevent retries, unsupported claims, or excessive exploration.

