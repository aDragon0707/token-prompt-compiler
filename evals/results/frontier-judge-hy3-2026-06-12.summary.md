# Skill Effect Judge Summary

This report is one-shot model judging evidence. It is not token-saving proof and still requires human audit before strong quality claims.

## Overall

- Judge: tokendance / hy3-preview
- Records judged: 312
- Average score: 5.503 / 10
- Task pass rate: 22.4%
- Claim boundary violation rate: 6.7%
- Over-packet rate: 17.3%

## Variant Summary

| Variant | Records | Avg score | Task pass | Avg total tokens | Over-packet | Claim violations |
|---|---:|---:|---:|---:|---:|---:|
| A | 104 | 4.538 | 16.3% | 1160.087 | 18.3% | 13.5% |
| B | 104 | 6.019 | 25% | 1986.433 | 19.2% | 3.8% |
| C | 104 | 5.952 | 26% | 4364.712 | 14.4% | 2.9% |

## Deltas

- B minus A avg score: 1.481
- C minus B avg score: -0.067
- C minus A avg score: 1.414

## Model Ranking

| Model | Records | Avg score | Task pass |
|---|---:|---:|---:|
| qwen3.6-max-preview | 24 | 7.417 | 33.3% |
| qwen3.7-max | 24 | 7.292 | 29.2% |
| seed-2.0-pro | 24 | 7.083 | 29.2% |
| hy3-preview | 24 | 6.75 | 29.2% |
| glm-5.1 | 24 | 6.625 | 33.3% |
| qwen3.5-flash | 24 | 6.583 | 33.3% |
| deepseek-v3.2 | 24 | 6.333 | 25% |
| kimi-k2.7-code | 24 | 5.25 | 20.8% |
| glm-4.5-air | 24 | 4.125 | 12.5% |
| minimax-m3 | 24 | 3.792 | 8.3% |
| step-3.5-flash | 24 | 3.708 | 12.5% |
| step-3.7-flash | 24 | 3.375 | 8.3% |
| deepseek-v4-pro | 24 | 3.208 | 16.7% |

## Claim Boundary

Judge scores behavior and quality only. Token or cost claims require provider usage, quality review, AB/BA controls, and pass-rule analysis.

## Residual Risk

This is one-shot model judging. Human audit of a 10-20% sample is required before strong quality claims.
