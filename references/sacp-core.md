# SACP Core

SACP v0.1 is the compact task-contract layer used by this skill.

Use it to convert messy human intent into a contract an agent can execute, verify, and repair without rereading the original conversation.

SACP is not a long prompt template. It is the protocol skeleton behind Prompt IR, model adapters, validator gates, and worker packets.

## Core Flow

```text
human intent
-> SACP contract
-> optional model adapter
-> execution
-> validator
-> repair or final evidence
```

## Required Core

Every reliable SACP contract needs these fields:

```yaml
sacp_version: 0.1
objective:
inputs:
input_boundaries:
output_contract:
validator:
```

| Field | Meaning |
|---|---|
| `objective` | The concrete result the user wants |
| `inputs` | Data, files, links, notes, images, or constraints the agent should use |
| `input_boundaries` | What is instruction, data, untrusted data, context, evidence, or out of scope |
| `output_contract` | The required artifact, language, shape, parser fields, or final response |
| `validator` | Observable checks that prove success or reveal failure |

## Optional Extensions

Add these only when they reduce ambiguity, risk, or retries:

```yaml
actor:
audience:
task_type:
context:
constraints:
tools:
evidence_policy:
repair_policy:
autonomy_budget:
failure_modes:
stop_rule:
target_adapter:
hash_receipt:
```

| Field | Use when |
|---|---|
| `actor` | The model needs a work stance, such as reviewer, implementer, teacher, or compiler |
| `audience` | The output must fit a reader or user group |
| `task_type` | The validator changes by domain, such as `static_web_artifact`, `code_change`, or `research_summary` |
| `constraints` | Something must be preserved, avoided, bounded, or forbidden |
| `tools` | Files, shell, browser, APIs, calculators, or retrieval may be needed |
| `evidence_policy` | Final claims need logs, screenshots, citations, paths, hashes, or command output |
| `repair_policy` | Missing requirements should be fixed before final output |
| `autonomy_budget` | The agent may use product judgment inside named boundaries |
| `failure_modes` | Known drift risks should be checked, such as prompt injection or format drift |
| `stop_rule` | The agent must stop for approval, missing evidence, unsafe scope, or repeated failure |
| `target_adapter` | GPT/OpenAI, Claude, Codex, Claude Code, or another runtime needs a dialect |
| `hash_receipt` | Replay, audit, tamper evidence, or chain-of-work integrity matters |

## Tiers

Use the smallest tier that changes the outcome.

### Tiny SACP

Use for small tasks with one clear action.

```yaml
sacp_version: 0.1
tier: tiny
objective:
boundary:
output:
validator:
stop_if:
```

### Standard SACP

Use for prompt optimization, handoffs, artifact tasks, code changes, and medium ambiguity.

```yaml
sacp_version: 0.1
tier: standard
objective:
inputs:
input_boundaries:
constraints:
output_contract:
validator:
repair_policy:
autonomy_budget:
stop_rule:
```

### Full SACP

Use for multi-agent, high-risk, external evidence, tool-heavy, or audit-sensitive tasks.

```yaml
sacp_version: 0.1
tier: full
objective:
actor:
audience:
task_type:
context:
inputs:
input_boundaries:
constraints:
tools:
output_contract:
validator:
evidence_policy:
repair_policy:
autonomy_budget:
failure_modes:
stop_rule:
target_adapter:
```

## Mapping to Prompt IR

Prompt IR is the model-neutral expression of SACP.

```text
SACP contract = protocol semantics
Prompt IR = neutral representation
GPT/Claude prompt = adapter output
validator script = executable validator
```

Do not create both a large SACP block and a large Prompt IR block unless the user asks for both. Usually one neutral contract is enough.

## Example: Static Web Artifact

Use this pattern when the user asks for a small static tool or webpage. The point is not to make the prompt longer; it is to lock the artifact contract while preserving useful product judgment.

```yaml
sacp_version: 0.1
tier: standard
task_type: static_web_artifact
objective: Create a self-contained static webpage tool for the requested product or workflow.
inputs:
  - user theme
  - required visible features
input_boundaries:
  allowed_scope:
    - plain HTML/CSS/JavaScript
    - local browser behavior
  do_not:
    - backend
    - API keys
    - external model calls
    - package installs unless requested
output_contract:
  files:
    - index.html
  requirements:
    - first screen is the usable tool
    - required input/output areas are visible
    - required scoring/checklist/status UI is visible when requested
    - mobile and desktop are readable
validator:
  - target file exists
  - required visible sections from the user task are present
  - local JavaScript updates output or state
  - no forbidden dependency or external API is required
  - desktop/mobile layout has no obvious overflow
repair_policy: If validation fails, fix the missing section, interaction, or layout before final response.
autonomy_budget:
  allowed:
    - copy, clear, example, mode, tighten, or similar small controls
    - restrained visual polish
  limit:
    - do not expand into backend, auth, storage, routing, or real API calls
stop_rule: Stop if the requested artifact requires network services, secrets, persistence, or scope expansion.
```

Case note: in a Prompt Compiler Lab static-page test, this SACP pattern produced a strong single-file artifact while avoiding the earlier mistake of forcing every webpage to contain benchmark-specific strings such as `Prompt IR`, `GPT/OpenAI version`, `Claude version`, or `[REDACTED_SECRET]`. See `tests/results/sacp-static-web-artifact-compiler-20260602.zh.md`.

## Anti-Patterns

- Do not output Full SACP for small clear tasks.
- Do not encode one benchmark's required strings as a universal default.
- Do not turn `autonomy_budget` into permission to expand scope.
- Do not use a natural-language checklist when a parser, script, command, or screenshot can verify the requirement.
- Do not use model adapter formatting to change the user's actual intent.
