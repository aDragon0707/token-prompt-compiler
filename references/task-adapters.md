# Task Adapters

Use task adapters only after a SACP contract names a `task_type`.

Task adapters translate the same SACP core into domain-specific validators. They should not teach full domain craft. For visual/frontend quality, pair with a dedicated frontend skill instead of expanding this compiler.

## Selection Rule

```yaml
task_type: prompt_lint | model_adapter | static_web_artifact | code_change | research_summary | writing_artifact | agent_handoff
```

Use the smallest adapter that prevents likely failure:

- `prompt_lint`: prevent vague objective, weak boundary, weak output contract, or non-checkable validator.
- `model_adapter`: prevent GPT/OpenAI and Claude variants from dropping different requirements.
- `static_web_artifact`: prevent missing visible sections, broken interactions, dependency drift, mobile overflow, or unverified behavior.
- `code_change`: prevent wrong files, unverified fixes, contract breaks, and missing test evidence.
- `research_summary`: prevent current claims without sources and inference/source confusion.
- `writing_artifact`: prevent missing audience, purpose, required sections, or tone.
- `agent_handoff`: prevent a worker from guessing scope, inputs, evidence, or stop conditions.

## Static Web Artifact

Use for single-file HTML/CSS/JS pages, dashboards, tools, demos, and local visual artifacts.

Keep this adapter generic. Derive required strings, visible sections, and interactions from the user's task. Do not default every webpage to Prompt Compiler Lab, GPT/Claude sections, or redaction unless the task calls for them.

### SACP Fields

```yaml
task_type: static_web_artifact
output_contract:
  target_files:
  required_visible_sections:
  required_interactions:
  responsive_requirements:
  forbidden_dependencies:
validator:
  static_checks:
  behavior_checks:
  visual_checks:
repair_policy:
  revise once if a required section, interaction, syntax check, or mobile check fails
autonomy_budget:
  allowed_small_controls:
  allowed_visual_polish:
  forbidden_scope_expansion:
```

### Generic Defaults

```yaml
target_files:
  - index.html
forbidden_dependencies:
  - React unless explicitly requested
  - Vue unless explicitly requested
  - Next.js unless explicitly requested
  - remote CDN/framework dependency unless explicitly requested
responsive_requirements:
  - include responsive CSS
  - no horizontal overflow at mobile width when browser verification is available
static_checks:
  - target file exists
  - required title/product name is present
  - required visible sections from the user request are present
  - required interactions from the user request are represented
  - inline JavaScript has no syntax errors
behavior_checks:
  - primary action changes the output or visible state
  - reset/clear/copy/mode controls work when requested or added
  - secret-like values are redacted only when secret handling is in scope
```

### Prompt Compiler Lab Example

Use this only when the user specifically asks for a Prompt Compiler Lab-style prompt compiler.

```yaml
required_visible_sections:
  - Prompt IR
  - GPT/OpenAI version
  - Claude version
  - Lint score
  - Validator checklist
required_strings:
  - "[REDACTED_SECRET]"
  - "@media"
required_interactions:
  - Generate or Compile updates output
  - GPT/Claude mode changes output shape or target label
  - Copy copies or selects output
  - Clear resets input/output
secret_redaction_check:
  - fake API-key-like input is emitted as [REDACTED_SECRET]
```

## Code Change

```yaml
task_type: code_change
validator:
  - only allowed files changed
  - requested behavior directly addressed
  - relevant focused command run
  - command result reported with exit status
repair_policy:
  - if verification fails and cause is in scope, fix and rerun once
```

## Research Summary

```yaml
task_type: research_summary
validator:
  - claims separated from inference
  - current or unstable facts verified with appropriate sources
  - missing evidence labeled
repair_policy:
  - downgrade unsupported claims or fetch evidence when allowed
```

## Agent Handoff

```yaml
task_type: agent_handoff
validator:
  - objective explicit
  - allowed scope explicit
  - do-not-touch scope explicit
  - read-first inputs listed or marked unknown
  - evidence required explicit
  - verification command/artifact explicit
  - stop rule explicit
```

