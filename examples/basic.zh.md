# 示例：中文自然语言到 Machine Task Packet

## 原始需求

```text
你帮我看看这个项目，整理一下现在的问题，然后想想怎么优化，最好不要乱动，先给我一个能执行的小计划。
```

## 编译后

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
Output format: Chinese memo under 800 words.
Stop rule: Stop if project entry points are unclear after 5 files.
Token policy: Do not read the whole repo; prefer rg and targeted file reads.
Adapter notes: For Codex, cite file paths and avoid edits. For Claude Code, this can become a read-only planning subagent task. For DeepSeek, keep this packet as the stable prefix and place project-specific variables after it.
```
