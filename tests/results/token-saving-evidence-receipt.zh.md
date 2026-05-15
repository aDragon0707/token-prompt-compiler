# Token Saving Evidence Receipt

Date: 2026-05-15

Purpose: compact evidence for judging whether token-prompt-compiler can claim real token savings.

## Evidence Checked

- `references/ab-test.md`: pass rule requires total_saving >= 25%, quality_delta >= -1, task_passed=true, retries <= A.
- `references/api-ab-test.md`: quality_score and token saving must be separate; task packets may increase input_tokens; judge total cost, not prompt length.
- `tests/results/claude-local-ab-utf8-2026-05-15T10-08-11-338Z.evaluated.json`: small README task.
- `tests/results/claude-large-ab-20260515.evaluated.json`: large full-evidence task.
- `tests/results/claude-large-compact-ab-20260515.evaluated.json`: large compact-output task.

## Run Results

| Test | A cost | B cost | A quality | B quality | Verdict |
|---|---:|---:|---:|---:|---|
| small README | 0.102385 | 0.127040 | 9 | 8 | fail token saving |
| large full evidence | 0.146690 | 0.147965 | 8 | 7 | fail token saving |
| large compact B | 0.142465 | 0.168145 | 8 | 7 | visible output shorter, cost higher |

## Lessons

- Behavior quality improved in some cases, especially visible structure and directness.
- Token/cost saving was not proven in local Claude Code runs.
- Short visible output is not enough: provider output_tokens and total_cost_usd can still rise.
- The likely saving mechanism is context control: full logs and broad docs should stay on disk; the model should read a compact evidence receipt plus only the protocol needed for the current decision.

## Current Claim Boundary

Safe claim:

```text
Machine Task Packets can improve boundaries, evidence discipline, and acceptance checks.
```

Unsafe claim:

```text
Machine Task Packets have been proven to reduce provider token cost.
```

Next valid test: compare broad-context A against compiled-context B, where B receives only this receipt plus the pass-rule protocol.
