# Output Shapes

Use the smallest shape that preserves the decision surface. Do not emit multiple large blocks unless the user asks for them.

## Tiny SACP

Use for small or already-scoped tasks.

```text
Tiny SACP
sacp_version: 0.1
Objective:
Boundary:
Output:
Validator:
Stop if:
```

## Standard SACP

Use for normal prompt optimization, handoffs, artifact tasks, and medium ambiguity.

```text
Standard SACP
sacp_version: 0.1
Objective:
Inputs:
Input boundaries:
Constraints:
Output contract:
Validator:
Repair policy:
Autonomy budget:
Stop rule:
```

## Legacy Machine Task Packet

Use only when the user explicitly asks for a Machine Task Packet or older worker-packet shape.

```text
Machine Task Packet
Goal:
Allowed scope:
Inputs:
Actions:
Evidence required:
Verification:
Output format:
Stop rule:
Adapter notes:
```

## Prompt Lint

Use when the user asks to optimize, review, or fix a prompt without executing the downstream task.

```text
Prompt Lint
Scores:
Critical gaps:
SACP:
Prompt IR: optional, only when useful
Reflection policy:
Improved prompt:
Hard validator:
Validator spec:
Validation script:
Self-repair gate:
Adapter notes:
```

For artifact-building prompt lint, include both `prompt_lint_score` and `artifact_quality_score`. Do not let clean wording hide a weak artifact validator.

## Model Adapter

Use one source contract and adapt style only.

```text
SACP:
Prompt IR: optional, only when useful
Reflection policy:
GPT/OpenAI version:
Claude version:
Hard validator:
Validator spec:
Validation script:
Self-repair gate:
Known tradeoffs:
```

## Static Web Artifact Prompt

Use when optimizing a webpage or tool-building prompt.

```text
SACP:
- task_type: static_web_artifact
- objective:
- inputs:
- input_boundaries:
- output_contract:
- hard_validator:
- validator_spec:
- self_repair_gate:
- autonomy_budget:

GPT/OpenAI version:
Claude version:
Validation script:
Known tradeoffs:
```

For `static_web_artifact`, derive required visible strings and interactions from the user's task. Make `Validation script` a no-dependency Node.js checker by default unless the user asks for another runtime. Do not default every webpage to Prompt Compiler Lab, GPT/Claude sections, or secret redaction unless the task calls for them.

## A/B Test

Use when the user asks to test token reduction or compare prompt behavior.

```text
A: original prompt
B: compiled packet
Fixed conditions:
Metrics: input_tokens, cached_tokens, output_tokens, reasoning_tokens, tool_calls, retries, task_passed, quality_score
Pass rule: >=25% total token reduction, quality_delta >= -1, task_passed=true
```

Read `ab-test.md` for the measurement protocol and `api-ab-test.md` for provider usage fields and runner details.
