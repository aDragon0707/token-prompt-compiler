# Benchmark Skeleton

This directory defines a reproducible benchmark structure for future token and cost evidence. It does not prove that SACP contracts or task packets save tokens.

Benchmark case files are checked against the repository contract in `schemas/benchmark-case.schema.json` by `npm run schema:smoke` and `npm run validate`.

Safe claim:

```text
This repository now has a reproducible benchmark skeleton.
```

Unsafe claim:

```text
SACP or task packets are proven to save tokens.
```

## Variant Meanings

- `A`: original prompt or broad context baseline.
- `B`: compiled contract, task packet, or compact receipt candidate.
- `C`: compiled contract plus hard validator and self-repair gate.

The current API runner supports shared-evidence A/B cases. It does not yet support variant-specific evidence for true context-saving tests. Context-saving cases are therefore template-only until the runner can feed different evidence shapes to each variant.

## Required Metrics

Real benchmark results should record:

```text
input_tokens
cached_tokens
output_tokens
reasoning_tokens
provider_total_tokens
prompt_cache_hit_tokens
prompt_cache_miss_tokens
tool_calls
retries
wall_time_sec
task_passed
quality_score
total_cost
claim_verdict
```

Missing usage fields must be recorded as `null`, not `0`.

## Pass Rule

A token-saving result is only a pass when:

```text
B task_passed = true
B quality_score >= A quality_score - 1
B total cost is at least 25% lower than A after provider pricing
B retries <= A retries
```

Dry-run proves only that the benchmark case is structurally runnable without API keys or provider calls. Dry-run is not token-saving proof.
