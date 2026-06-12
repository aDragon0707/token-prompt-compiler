# Frontier Static Effect Run - 2026-06-12

This receipt summarizes the first frontier-model static skill-effect run. It is
provider execution evidence, not token-saving proof and not a judged quality
verdict.

## Scope

- Dataset: `tests/skill-trigger-cases.json`
- Variants: A no-skill baseline, B skill loaded, C skill plus routed reference
- Runs: 1 per case / variant / model
- Raw outputs: `eval-runs/` (ignored by git)
- Public summaries: `evals/results/*.summary.json`

## Provider Smoke Findings

- StepFun normal Chat Completions works at `https://api.stepfun.com/v1`.
- TokenDance `/models` returned 62 models.
- `kimi-k2.7-code` requires `temperature=1`; `temperature=0` returns a
  provider validation error.
- All selected frontier text models exposed usage fields in this run.

## Result Files

| File | Provider | Models | Records | Status |
|---|---:|---|---:|---|
| `initial-stepfun.summary.json` | StepFun | `step-3.5-flash` | 24 | complete |
| `initial-tokendance.summary.json` | TokenDance | `deepseek-v3.2`, `qwen3.5-flash`, `glm-4.5-air` | 72 | complete |
| `frontier-stepfun-step37.summary.json` | StepFun | `step-3.7-flash` | 24 | complete |
| `frontier-tokendance-a.summary.json` | TokenDance | `deepseek-v4-pro`, `qwen3.7-max` | 48 | complete |
| `frontier-tokendance-b.summary.json` | TokenDance | `glm-5.1`, `minimax-m3` | 48 | complete |
| `frontier-tokendance-c.summary.json` | TokenDance | `seed-2.0-pro`, `hy3-preview`, `qwen3.6-max-preview` | 72 | complete |
| `frontier-tokendance-kimi.summary.json` | TokenDance | `kimi-k2.7-code` | 24 | complete |

Total public summary coverage: 13 models, 312 records, all provider calls
completed with `ok_rate=1` and `usage_field_coverage=1`.

## Model-Level Snapshot

| Provider | Model | Records | Avg latency sec | Avg input tokens | Avg output tokens | Avg total tokens |
|---|---|---:|---:|---:|---:|---:|
| StepFun | `step-3.5-flash` | 24 | 7.103 | 1588.625 | 598.958 | 2187.583 |
| StepFun | `step-3.7-flash` | 24 | 6.490 | 1588.625 | 580.542 | 2169.167 |
| TokenDance | `deepseek-v3.2` | 24 | 51.617 | 1575.625 | 476.333 | 2051.958 |
| TokenDance | `deepseek-v4-pro` | 24 | 11.223 | 1575.625 | 639.417 | 2215.042 |
| TokenDance | `glm-4.5-air` | 24 | 11.833 | 1536.500 | 539.667 | 2076.167 |
| TokenDance | `glm-5.1` | 24 | 15.668 | 1535.500 | 587.333 | 2122.833 |
| TokenDance | `hy3-preview` | 24 | 9.282 | 1557.042 | 384.042 | 1941.083 |
| TokenDance | `kimi-k2.7-code` | 24 | 12.482 | 1515.750 | 565.375 | 2081.125 |
| TokenDance | `minimax-m3` | 24 | 17.355 | 1678.667 | 630.083 | 2308.750 |
| TokenDance | `qwen3.5-flash` | 24 | 11.891 | 1627.042 | 1480.333 | 3107.375 |
| TokenDance | `qwen3.6-max-preview` | 24 | 55.440 | 1627.042 | 2032.958 | 3660.000 |
| TokenDance | `qwen3.7-max` | 24 | 34.635 | 1627.042 | 1774.417 | 3401.458 |
| TokenDance | `seed-2.0-pro` | 24 | 37.411 | 1691.333 | 1534.792 | 3226.125 |

## Early Interpretation

- Compatibility: strong. Every selected provider/model completed all assigned
  calls and returned provider usage fields.
- Latency: frontier reasoning models vary widely. `deepseek-v4-pro`,
  `hy3-preview`, `kimi-k2.7-code`, and StepFun flash models were relatively
  fast in this harness. `qwen3.6-max-preview`, `deepseek-v3.2`, `seed-2.0-pro`,
  and `qwen3.7-max` were much slower.
- Token behavior: Variant B and C add substantial input context. Some models
  reduce output tokens under B/C, but this run does not show a total-token saving
  claim by itself.
- Reference routing: Variant C is expensive because routed references add large
  input context. It should be justified by quality or boundary improvements, not
  by raw token count.

## Claim Boundary

Safe claim:

```text
This run shows that the static A/B/C skill-effect harness can execute across
StepFun and TokenDance frontier models with complete provider usage fields.
```

Unsafe claim:

```text
token-prompt-compiler is proven to save tokens or improve quality.
```

The next required step is a one-shot judge plus manual audit sample that scores
trigger correctness, boundary following, reference routing, claim safety, prompt
quality, over-packet penalty, and output usefulness.
