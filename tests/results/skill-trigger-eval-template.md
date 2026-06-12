# Skill Trigger Eval Result Template

This template records trigger quality only. It is not token/cost proof and must not be cited as token-saving evidence.

## Run Metadata

| Field | Value |
|---|---|
| model/runtime |  |
| date |  |
| evaluator |  |
| repository commit |  |
| skill version/source |  |

## Result Table

| case id | observed behavior | references read | pass/fail | notes |
|---|---|---|---|---|
| `bare-invocation` |  |  |  |  |
| `compile-only` |  |  |  |  |
| `compile-then-execute` |  |  |  |  |
| `prompt-lint-reflection` |  |  |  |  |
| `model-adapter` |  |  |  |  |
| `benchmark-claim` |  |  |  |  |
| `complex-repo-plan-escalation` |  |  |  |  |
| `small-scoped-skip-full-packet` |  |  |  |  |

## Notes

- Record `not visible` under `references read` if the runtime does not expose file reads.
- Mark `pass/fail` as `pass`, `partial`, or `fail`.
- Do not include secrets, API keys, cookies, private URLs, or raw credentials.
- If a case fails, record the exact behavior that violated `must_not` or missed `expected_behavior`.

## Claim Boundary

Safe claim:

```text
These results describe observed skill trigger behavior for the listed model/runtime and cases.
```

Unsafe claim:

```text
These results prove token-prompt-compiler saves tokens or cost.
```
