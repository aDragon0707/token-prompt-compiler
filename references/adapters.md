# Model Adapter Notes

Use the same packet shape, then tune the adapter note.

## Codex

Emphasize:

- file paths
- commands
- diffs
- tests
- receipts
- strict edit scope

Good adapter note:

```text
For Codex: use rg before broad reads, touch only allowed files, summarize tool output, report changed files and verification commands.
```

## Claude Code

Emphasize:

- worktree boundaries
- subagent roles
- hooks
- stop conditions
- handoff format

Good adapter note:

```text
For Claude Code: run this as a narrow subagent/worktree task; return diff, test log, and handoff receipt.
```

## Gemini CLI

Emphasize:

- explicit file scope
- structured output
- grounding requirements
- code execution boundaries

Good adapter note:

```text
For Gemini CLI: keep file scope explicit, require structured output, and mark any grounded claims with source references.
```

## DeepSeek

Emphasize:

- stable prefix
- JSON mode when parsing matters
- cache-hit friendly repeated instructions
- low output verbosity

Good adapter note:

```text
For DeepSeek: keep this packet as stable prefix, place task variables after it, use JSON mode for parseable output, and cap final answer length.
```

## OpenAI Agents

Emphasize:

- tools
- handoffs
- tracing
- eval fields
- structured outputs

Good adapter note:

```text
For OpenAI Agents: represent actions as tool/handoff steps, preserve trace fields, and return structured output for grading.
```

