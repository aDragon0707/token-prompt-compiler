# Human-to-Machine Task Packet Spec

Detailed spec now lives in `references/spec.md`.

This root file is kept as a short public entry point.

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

For field meanings, compilation classes, and examples, see:

```text
references/spec.md
references/adapters.md
references/prompt-ir-schema.md
references/lint-rubric.md
references/official-tools.md
references/ab-test.md
references/related-work.md
```

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
