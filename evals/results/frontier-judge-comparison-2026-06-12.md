# Frontier Judge Comparison - 2026-06-12

This receipt summarizes the Phase 6 one-shot judge run over the frontier static
skill-effect dataset. It is quality and behavior evidence, not token-saving
proof.

## Inputs

- Source raw files: 7 files under `eval-runs/`
- Source records: 312
- Source model set: 13 models across StepFun and TokenDance
- Variants:
  - A: no-skill baseline
  - B: skill loaded
  - C: skill plus routed reference

Raw judge records are stored under `eval-runs/` and are ignored by git. Public
judge summaries are stored under `evals/results/`.

## Judge Runs

| Judge | Summary | Records | Judge ok rate | Avg score | Task pass | Claim violations | Over-packet |
|---|---|---:|---:|---:|---:|---:|---:|
| `glm-5.1` | `frontier-judge-glm51-2026-06-12.summary.json` | 312 | 93.9% | 5.072 | 25.3% | 5.4% | 22.4% |
| `hy3-preview` | `frontier-judge-hy3-2026-06-12.summary.json` | 312 | 98.1% | 5.503 | 22.4% | 6.7% | 17.3% |

The two judges broadly agree on the shape of the result:

- Variant B improves over Variant A.
- Variant C does not reliably improve over Variant B.
- Variant C adds large input-token overhead because routed references are loaded.
- The main failure class is still underspecified output or weak reference usage,
  not provider compatibility.

## Variant Deltas

### GLM-5.1 judge

| Delta | Avg score | Task pass | Claim violations | Over-packet | Avg total tokens |
|---|---:|---:|---:|---:|---:|
| B - A | +2.297 | +18.3 pp | -8.6 pp | -21.1 pp | +826.346 |
| C - B | -0.542 | +1.9 pp | -1.0 pp | +0.0 pp | +2378.279 |
| C - A | +1.755 | +20.2 pp | -9.6 pp | -21.1 pp | +3204.625 |

### HY3-preview judge

| Delta | Avg score | Task pass | Claim violations | Over-packet | Avg total tokens |
|---|---:|---:|---:|---:|---:|
| B - A | +1.481 | +8.7 pp | -9.7 pp | +0.9 pp | +826.346 |
| C - B | -0.067 | +1.0 pp | -0.9 pp | -4.8 pp | +2378.279 |
| C - A | +1.414 | +9.7 pp | -10.6 pp | -3.9 pp | +3204.625 |

## Interpretation

The current evidence supports this narrow claim:

```text
Loading token-prompt-compiler's core skill instructions improves static trigger
and boundary behavior compared with no-skill prompts in this dataset.
```

The current evidence does not support this stronger claim:

```text
Loading routed references always improves quality enough to justify the extra
tokens.
```

In this run, routed references improve some pass rates slightly but add a large
token overhead. C should be reserved for cases where the reference router is
actually needed, not used as the default path.

## Model Ranking Notes

Both judges rank the stronger frontier models above the initial smoke models.
The exact ordering differs, so do not overfit to a single judge rank. The stable
signal is that Qwen/Seed/GLM/HY-family frontier models score better than the
lowest baseline models under this static harness.

## Known Limits

- This is one-shot model judging, not human adjudication.
- GLM-5.1 had 93.9% judge-ok coverage; HY3-preview had 98.1%.
- Some judge failures are parse or provider errors, not candidate-output errors.
- The rubric currently rewards behavior and quality; it does not price tokens.
- Cost evidence still requires provider pricing, quality thresholding, and AB/BA
  controls.

## Next Step

Before claiming 90+ quality, manually audit 10-20% of records with attention to:

- whether the judge is too harsh on compile-only outputs;
- whether reference routing is scored fairly for Variant C;
- whether unsupported token-saving claims are caught consistently;
- whether small tasks are penalized correctly when B/C add unnecessary packet
  structure.
