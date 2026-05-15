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

Strong pass:

```text
total_saving >= 40%
quality_delta >= 0
retries < original retries
evidence quality unchanged or better
```

