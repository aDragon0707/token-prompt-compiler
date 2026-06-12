# Eval Results

This directory stores sanitized summaries from skill effect evals.

Commit these:

- `*.summary.json`
- `*.summary.md`
- result receipts that contain no API keys, account identifiers, raw private
  prompts, or full provider error dumps

Do not commit these:

- raw model outputs
- full traces
- API keys
- account metadata
- provider request IDs if they identify the account

Raw local runs belong in `eval-runs/`, which is ignored by git.

## Evidence Tiers

Trigger evidence:

```text
The skill changed trigger, boundary, reference routing, or output behavior.
```

Quality evidence:

```text
The skill improved output quality under the rubric and manual audit.
```

Cost evidence:

```text
Provider usage, quality score, AB/BA control, and pass rule all support a cost
claim.
```

Provider smoke is not benchmark evidence. A shorter visible answer is not
token-saving proof.
