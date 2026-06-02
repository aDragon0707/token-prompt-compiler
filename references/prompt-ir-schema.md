# Prompt IR Schema

Prompt IR is the model-neutral intermediate representation of a SACP task contract.

Use Prompt IR when a SACP contract needs model-specific adaptation, prompt linting, handoff clarity, eval fields, validators, or multi-step agent work.

```text
SACP = protocol semantics
Prompt IR = neutral representation
GPT/Claude prompt = adapter output
validator script = executable acceptance check
```

## Required Core

These fields form the minimum reliable prompt contract:

```yaml
sacp_version:
objective:
inputs:
input_boundaries:
output_contract:
validator:
```

| Field | Purpose |
|---|---|
| `sacp_version` | The SACP protocol version, usually `0.1` |
| `objective` | The concrete job the model/agent must complete |
| `inputs` | The material the model should process |
| `input_boundaries` | Which content is data, untrusted data, context, instruction, or evidence |
| `output_contract` | Required shape, language, fields, parser expectations, and forbidden extras |
| `validator` | How success is checked by a human, parser, test, rubric, or eval |

## Full Prompt IR

```yaml
sacp_version:
tier:
objective:
audience:
role:
task_type:
context:
inputs:
input_boundaries:
constraints:
tools:
output_contract:
validator:
hard_validator:
validator_spec:
self_repair_gate:
autonomy_budget:
failure_modes:
stop_rule:
target_models:
adapter_notes:
```

## Field Semantics

| Field | Use when | Notes |
|---|---|---|
| `tier` | The contract size matters | Use `tiny`, `standard`, or `full`; see `sacp-core.md` |
| `audience` | Output must be adapted to a reader/user | Prefer known concepts and constraints over age labels |
| `role` | A task benefits from a work stance | Role must include strategy, not just identity |
| `task_type` | The output domain changes the validator | Use `static_web_artifact`, `code_change`, `prompt_lint`, `model_adapter`, `research_summary`, `writing_artifact`, or `agent_handoff` |
| `context` | Background changes the task interpretation | Keep short; reference long context by path or receipt |
| `constraints` | The model must avoid or preserve something | Include forbidden behavior and invariants |
| `tools` | External facts, code, files, calculations, or actions are needed | Name allowed tools and when to stop for approval |
| `hard_validator` | Missing a requirement would make the output fail | Use observable checks, exact required sections, commands, parser checks, or forbidden strings |
| `validator_spec` | The validator should be executable or scriptable | Include target file, required strings, forbidden strings, syntax checks, responsive checks, and redaction checks when relevant |
| `self_repair_gate` | The model/agent should revise before final output | Tell it to check every validator item and repair missing in-scope items before responding |
| `autonomy_budget` | The agent should preserve useful product judgment | Name optional small controls or improvements allowed if they do not violate scope |
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
hard_validator:
validator_spec:
self_repair_gate:
autonomy_budget:
official_adapter:
hash_receipt:
token_policy:
handoff:
```

- `role`: Add when the model needs a stable work stance, review posture, or domain frame.
- `examples`: Add when output format or judgment criteria are hard to describe.
- `tools`: Add when external execution, retrieval, calculation, or approval boundaries matter.
- `rubric`: Add when quality cannot be checked by simple fields or string matching.
- `hard_validator`: Add when a checklist must become an acceptance gate.
- `validator_spec`: Add when the downstream worker should emit or run a concrete verifier.
- `self_repair_gate`: Add when the worker should fix missing requirements before final response.
- `autonomy_budget`: Add when the task should keep useful agent creativity inside bounded scope.
- `official_adapter`: Add only when the user asks for official optimizer/eval tooling.
- `hash_receipt`: Add when auditability, replay, or tamper evidence matters.

## Good Prompt IR Checklist

- The IR preserves the SACP contract without adding unrelated scope.
- The objective can be completed without rereading the original messy request.
- Input data is clearly separated from instructions and system rules.
- The output contract can be parsed or reviewed consistently.
- Validator states what evidence proves success and what fails.
- Hard validator uses observable checks instead of style-only wishes.
- Validator spec can become a command, script, parser check, or exact evidence receipt.
- Self-repair gate says what to revise before final output and what to mark unverified.
- Autonomy budget preserves helpful defaults without weakening required constraints.
- Target model adapters can be generated without changing the task meaning.
