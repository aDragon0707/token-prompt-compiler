# Token Reduction A/B Test Protocol

Goal:

```text
Prove a compiled task packet reduces token waste without lowering task quality.
```

## Variants

```text
A = original human-language request
B = compiled Machine Task Packet
```

Test only one variable at a time.

For context-saving tests:

```text
A = broad context, full documents, full logs
B = compact evidence receipt + minimum task packet + paths to full logs
```

This is the main mechanism to test when the claim is token reduction. A packet that reads the same full evidence as the original prompt may improve behavior without reducing cost.

## Fixed Conditions

Keep these unchanged:

```text
model
reasoning_effort
temperature
max_output_tokens
input files
allowed tools
expected output
verification command
```

## Metrics

Record:

```text
input_tokens
cached_tokens
output_tokens
reasoning_tokens
total_tokens
tool_calls
files_read
retries
wall_time_sec
task_passed
quality_score
visible_chars
total_cost
cost_per_pass
cost_variance
flakiness_rate
```

DeepSeek-specific:

```text
prompt_cache_hit_tokens
prompt_cache_miss_tokens
```

## Quality Score

10 points:

```text
2 goal completed
2 scope followed
2 evidence provided
2 verification possible
2 output usable
```

## Pass Rule

```text
total_saving >= 25%
quality_delta >= -1
task_passed = true
retries <= original retries
```

Use provider usage or provider-priced cost for the final verdict. Do not pass a test only because the visible answer is shorter.

For non-deterministic tasks, run at least 3 trials when practical and record majority pass rate. Treat a variant as flaky when the same fixed conditions produce different pass/fail results, and do not promote a route on a single lucky pass.

Strong pass:

```text
total_saving >= 40%
quality_delta >= 0
retries < original retries
evidence quality unchanged or better
```

## Claim Boundary

Safe claim after a passing context-saving test:

```text
Compiled task packets can reduce total cost when they replace broad context with a compact evidence receipt and minimum task contract.
```

Unsafe claim without provider usage evidence:

```text
Machine Task Packets always save tokens.
```

Known caveat:

```text
Small, already-scoped tasks may spend more input tokens on packet structure than they save in output or retries.
```

Local runner caveat:

```text
CLI wrappers may add system/project overhead or route through helper models.
Record provider usage by model when available.
Use bare/minimal mode and fixed model for cleaner measurement.
```

Cache caveat:

```text
High cache_read tokens reduce repeated-prefix cost, but do not prove the prompt is token-efficient.
Compare cached full-context prompts against Micro Receipt prompts when the next decision only needs facts.
Record uncached input, cached input, output, reasoning, and total provider cost separately.
```

Output constraint caveat:

```text
Shorter visible output can still cost more.
Overly rigid line, character, or required-string constraints may increase provider output_tokens.
Prefer short-bullet guidance plus "no meta/postscript" unless strict schema is needed downstream.
```

## Behavior Quality A/B Tests

Not every A/B test is about token reduction. Some tests should measure whether a compiled prompt improves the final artifact.

For artifact-building tasks, compare:

```text
A = broad human prompt
B = compiled prompt
C = compiled prompt + hard validator + self-repair gate
```

Record feature coverage separately from prompt clarity. A compiled prompt can look cleaner while producing a weaker artifact if the validator is only implied.

Use exact acceptance checks when possible:

```text
required strings
required files
forbidden dependencies
syntax checks
browser checks
mobile overflow checks
secret redaction checks
```

Claim boundary:

```text
Prompt compilation improves reliability only when it preserves the agent's useful autonomy and adds executable validation.
```
