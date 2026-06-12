# Skill Effect Judge Summary

This report is one-shot model judging evidence. It is not token-saving proof and still requires human audit before strong quality claims.

## Overall

- Judge: tokendance / glm-5.1
- Records judged: 312
- Average score: 5.072 / 10
- Task pass rate: 25.3%
- Claim boundary violation rate: 5.4%
- Over-packet rate: 22.4%

## Variant Summary

| Variant | Records | Avg score | Task pass | Avg total tokens | Over-packet | Claim violations |
|---|---:|---:|---:|---:|---:|---:|
| A | 104 | 3.721 | 12.5% | 1160.087 | 36.5% | 11.5% |
| B | 104 | 6.018 | 30.8% | 1986.433 | 15.4% | 2.9% |
| C | 104 | 5.476 | 32.7% | 4364.712 | 15.4% | 1.9% |

## Deltas

- B minus A avg score: 2.297
- C minus B avg score: -0.542
- C minus A avg score: 1.755

## Model Ranking

| Model | Records | Avg score | Task pass |
|---|---:|---:|---:|
| qwen3.7-max | 24 | 6.729 | 41.7% |
| qwen3.5-flash | 24 | 6.573 | 41.7% |
| qwen3.6-max-preview | 24 | 6.333 | 45.8% |
| seed-2.0-pro | 24 | 6.063 | 41.7% |
| hy3-preview | 24 | 5.7 | 29.2% |
| deepseek-v3.2 | 24 | 5.063 | 16.7% |
| glm-4.5-air | 24 | 4.667 | 16.7% |
| kimi-k2.7-code | 24 | 4.638 | 20.8% |
| glm-5.1 | 24 | 4.521 | 25% |
| minimax-m3 | 24 | 4.292 | 8.3% |
| step-3.7-flash | 24 | 4.063 | 12.5% |
| step-3.5-flash | 24 | 3.917 | 16.7% |
| deepseek-v4-pro | 24 | 3.375 | 12.5% |

## Claim Boundary

Judge scores behavior and quality only. Token or cost claims require provider usage, quality review, AB/BA controls, and pass-rule analysis.

## Residual Risk

This is one-shot model judging. Human audit of a 10-20% sample is required before strong quality claims.
