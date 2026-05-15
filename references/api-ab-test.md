# API-Level A/B Test Protocol

Goal: verify whether Machine Task Packet reduces total model cost, not merely whether the answer looks more orderly.

## Test Design

Variants:

```text
A = original human-language prompt
B = compiled Machine Task Packet
```

Fixed conditions:

```text
same provider
same model
same reasoning effort
same temperature
same max output tokens
same shared evidence
same expected output
same manual quality rubric
```

Important correction for API tests:

```text
The API cannot read a local file path by itself.
Put the same file content into a shared evidence block for both A and B.
Then append only the variant-specific instruction.
```

Run order:

```text
Run AB and BA, or run multiple paired rounds.
Record cached tokens separately because the second call may benefit from prompt cache.
```

## Minimal Command

OpenAI:

```powershell
$env:OPENAI_API_KEY="..."
node scripts/run-api-ab-test.mjs --provider openai --model gpt-5.4-mini --case tests/api-ab-case.zh.json --runs 3 --order AB --out tests/results/openai-api-ab.json
```

DeepSeek optional:

```powershell
$env:DEEPSEEK_API_KEY="..."
node scripts/run-api-ab-test.mjs --provider deepseek --model deepseek-chat --case tests/api-ab-case.zh.json --runs 3 --order AB --out tests/results/deepseek-api-ab.json
```

Repeat with `--order BA` to expose order/cache bias.

## Required Usage Fields

Record these fields for each variant run:

```json
{
  "input_tokens": 0,
  "cached_tokens": 0,
  "output_tokens": 0,
  "reasoning_tokens": 0,
  "provider_total_tokens": 0,
  "prompt_cache_hit_tokens": 0,
  "prompt_cache_miss_tokens": 0,
  "unavailable_fields": []
}
```

Field availability:

```text
OpenAI:
- input_tokens: usage.input_tokens
- cached_tokens: usage.input_tokens_details.cached_tokens, when returned
- output_tokens: usage.output_tokens
- reasoning_tokens: usage.output_tokens_details.reasoning_tokens, when returned by the model/API

DeepSeek:
- input_tokens: usage.prompt_tokens
- output_tokens: usage.completion_tokens
- cached_tokens: usage.prompt_cache_hit_tokens, when returned
- prompt_cache_hit_tokens: usage.prompt_cache_hit_tokens, when returned
- prompt_cache_miss_tokens: usage.prompt_cache_miss_tokens, when returned
- reasoning_tokens: may be unavailable on non-reasoner models
```

If a field is absent, store `null` and list it in `unavailable_fields`. Do not silently convert missing fields to zero.

## Result JSON Schema

```json
{
  "schema_version": "api-ab-result.v1",
  "task_id": "string",
  "provider": "openai | deepseek",
  "model": "string",
  "fixed_conditions": {
    "runs": 1,
    "order": "AB | BA",
    "temperature": 0,
    "max_output_tokens": 700,
    "reasoning_effort": "none | low | medium | high",
    "input_files": [
      {
        "label": "README.md",
        "path": "D:\\GitHub\\token-prompt-compiler\\README.md"
      }
    ]
  },
  "variant_summaries": {
    "A": {
      "runs": 1,
      "avg_usage": {
        "input_tokens": 0,
        "cached_tokens": 0,
        "output_tokens": 0,
        "reasoning_tokens": 0,
        "provider_total_tokens": 0
      },
      "avg_total_cost_proxy": {
        "uncached_input_tokens": 0,
        "cached_tokens": 0,
        "output_tokens": 0,
        "reasoning_tokens": 0,
        "provider_total_tokens": 0,
        "unpriced_weighted_units": 0,
        "protocol_total_tokens": 0
      },
      "quality_scores": [null],
      "format_scores_0_to_8": [0]
    },
    "B": {
      "runs": 1,
      "avg_usage": {
        "input_tokens": 0,
        "cached_tokens": 0,
        "output_tokens": 0,
        "reasoning_tokens": 0,
        "provider_total_tokens": 0
      },
      "avg_total_cost_proxy": {
        "uncached_input_tokens": 0,
        "cached_tokens": 0,
        "output_tokens": 0,
        "reasoning_tokens": 0,
        "provider_total_tokens": 0,
        "unpriced_weighted_units": 0,
        "protocol_total_tokens": 0
      },
      "quality_scores": [null],
      "format_scores_0_to_8": [0]
    }
  },
  "token_saving_ratio": 0,
  "pass_rule": {
    "required_token_saving_ratio": 0.25,
    "required_quality_delta_min": -1,
    "required_task_passed": true,
    "retry_rule": "B retries must be <= A retries when retries are measured.",
    "current_verdict": "pending_manual_quality_score | pass | fail"
  },
  "records": []
}
```

## Scoring

Keep `quality_score` separate from token usage.

Manual quality score, 10 points:

```text
2 exactly 3 README improvement points
2 each point concrete and actionable
2 each point maps to README content
2 follows scope: README only, no edits, no web
2 concise, no extra filler
```

The runner may produce a structural `format_score_0_to_8`, but this is not a replacement for `quality_score`.

## Cost Judgment

Do not judge only by single prompt length.

Task packet can increase `input_tokens`, especially on small tasks. It only wins if total cost improves after considering:

```text
uncached input tokens
cached input tokens
output tokens
reasoning tokens when available
tool calls, if the runtime has tools
retries
manual repair or parser failure, if measured
quality_score
task_passed
```

Use provider pricing for final money cost. Be careful not to double-charge reasoning tokens if the provider already includes reasoning inside output or total tokens.

## Pass Rule

Pass:

```text
B task_passed = true
B quality_score >= A quality_score - 1
B total cost is at least 25% lower than A after applying provider prices
B retries <= A retries
```

Strong pass:

```text
B quality_score >= A quality_score
B total cost is at least 40% lower than A
B output_tokens and retries are both lower
evidence quality is unchanged or better
```

Fail or inconclusive:

```text
B increases input_tokens and does not reduce output/reasoning/retry cost enough.
B quality_score drops by more than 1 point.
Any required usage field is unavailable and the missing field could change the verdict.
Only behavior improved, but total provider cost did not improve.
```
