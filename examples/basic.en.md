# Example: Natural Language to Machine Task Packet

## Original Request

```text
Help me review this project, organize the current problems, and think about how to improve it. Do not mess things up. Give me a small executable plan first.
```

## Compiled

```text
Machine Task Packet
Goal: Review the current project state and produce a small executable improvement plan.
Why now: The user wants clarity before changing files.
Allowed scope: Read project overview files, recent docs, and visible entry points only.
Read first: README / AGENTS / package config / main app entry / latest worklog if present.
Do not touch: Do not edit code or run destructive commands.
Actions:
- Identify 3 current issues.
- Identify 3 low-risk improvements.
- Recommend the first task to implement.
Evidence required:
- Cite file paths for every issue.
- Mark assumptions clearly.
Verification:
- No file edits.
- Output contains next action and stop condition.
Output format: Concise memo under 800 words.
Stop rule: Stop if project entry points are unclear after 5 files.
Token policy: Do not read the whole repo; prefer rg and targeted file reads.
Adapter notes: For Codex, cite file paths and avoid edits. For Claude Code, this can become a read-only planning subagent task. For DeepSeek, keep this packet as the stable prefix and place project-specific variables after it.
```
