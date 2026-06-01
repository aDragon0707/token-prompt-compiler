# Prompt IR Schema

Prompt IR is the model-neutral intermediate representation between messy human intent and model-specific prompts.

Use Prompt IR when the task involves prompt optimization, prompt review, model-specific adaptation, handoff risk, evals, validators, or multi-step agent work.

## Required Core

These fields form the minimum reliable prompt contract:

```yaml
objective:
inputs:
input_boundaries:
output_contract:
validator:
```

| Field | Purpose |
|---|---|
| `objective` | The concrete job the model/agent must complete |
| `inputs` | The material the model should process |
| `input_boundaries` | Which content is data, untrusted data, context, instruction, or evidence |
| `output_contract` | Required shape, language, fields, parser expectations, and forbidden extras |
| `validator` | How success is checked by a human, parser, test, rubric, or eval |

## Full Prompt IR

```yaml
objective:
audience:
role:
context:
inputs:
input_boundaries:
constraints:
tools:
output_contract:
validator:
failure_modes:
stop_rule:
target_models:
adapter_notes:
```

## Field Semantics

| Field | Use when | Notes |
|---|---|---|
| `audience` | Output must be adapted to a reader/user | Prefer known concepts and constraints over age labels |
| `role` | A task benefits from a work stance | Role must include strategy, not just identity |
| `context` | Background changes the task interpretation | Keep short; reference long context by path or receipt |
| `constraints` | The model must avoid or preserve something | Include forbidden behavior and invariants |
| `tools` | External facts, code, files, calculations, or actions are needed | Name allowed tools and when to stop for approval |
| `failure_modes` | Known ways the prompt can drift | Include prompt injection, unsupported claims, format drift |
| `stop_rule` | The agent must stop under specific conditions | Use for missing evidence, unsafe scope, repeated failures |
| `target_models` | The prompt will be adapted | Phase 1 supports `gpt-openai` and `claude` deeply |
| `adapter_notes` | Target-model differences matter | Keep adapter details out of the neutral IR when possible |

## Optional Enrichments

Use these only when they reduce real ambiguity or retries:

```yaml
role:
examples:
tools:
rubric:
official_adapter:
hash_receipt:
token_policy:
handoff:
```

- `role`: Add when the model needs a stable work stance, review posture, or domain frame.
- `examples`: Add when output format or judgment criteria are hard to describe.
- `tools`: Add when external execution, retrieval, calculation, or approval boundaries matter.
- `rubric`: Add when quality cannot be checked by simple fields or string matching.
- `official_adapter`: Add only when the user asks for official optimizer/eval tooling.
- `hash_receipt`: Add when auditability, replay, or tamper evidence matters.

## Good Prompt IR Checklist

- The objective can be completed without rereading the original messy request.
- Input data is clearly separated from instructions and system rules.
- The output contract can be parsed or reviewed consistently.
- Validator states what evidence proves success and what fails.
- Target model adapters can be generated without changing the task meaning.
