# Benchmark Results

Store real benchmark result files in this directory when provider usage has been collected.

Every result should include:

```text
provider
model
fixed_conditions
usage fields
quality_score
task_passed
claim_verdict
```

Missing provider usage fields must be `null`, not `0`. A missing field that could change the verdict makes the result inconclusive.

Manual `quality_score` is separate from token saving. A run can look cheaper and still fail if quality drops too far, the task does not pass, or required evidence is missing.

Do not promote a benchmark result into a public token-saving claim until provider usage, quality score, task pass/fail, and claim boundary have all been reviewed together.
