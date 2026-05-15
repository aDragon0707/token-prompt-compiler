# Token Prompt Compiler

**English** | [中文](#中文)

Token Prompt Compiler turns messy human-language requests into token-efficient, machine-readable task packets for LLMs and agent systems.

It works as a Codex skill, but the core idea is model-agnostic: compile human intent into a compact contract that Codex, Claude Code, Gemini CLI, DeepSeek, OpenAI Agents, or another LLM agent can execute with less wasted context.

It is designed for agentic coding, research, writing, review, and multi-agent workflows where the real cost is not only model price, but also unclear scope, repeated context, unnecessary tool output, failed retries, and agent drift.

## Why

Most prompt optimization focuses on making prompts shorter. This project focuses on making prompts more machine-readable and executable.

The goal is not simply to reduce words. The goal is to preserve the decision surface:

```text
goal -> scope -> inputs -> actions -> evidence -> verification -> stop rule
```

This helps LLM agents spend fewer tokens guessing intent, rereading history, exploring irrelevant files, or producing long unsupported summaries.

## What It Does

It compiles requests like:

```text
Help me look at these materials and think about what to do next.
```

Into a task packet like:

```text
Goal: Review the provided materials and produce a decision memo.
Allowed scope: Only the provided files/links.
Actions: Extract 5 useful signals, 3 risks, 3 next actions.
Evidence required: Cite file paths/URLs for each signal.
Output format: Chinese memo under 800 words.
Stop rule: Stop if required sources are unavailable.
```

## Output Format

```text
Machine Task Packet
Goal:
Why now:
Allowed scope:
Read first:
Do not touch:
Actions:
Evidence required:
Verification:
Output format:
Stop rule:
Token policy:
Adapter notes:
```

For full field semantics, see [`SPEC.md`](SPEC.md) and [`references/spec.md`](references/spec.md).

## Use Cases

- Compress long user reflections into actionable machine-readable tasks.
- Prepare worker prompts for multi-agent workflows.
- Reduce repeated context loading.
- Add evidence and verification requirements before execution.
- Prevent agent drift with explicit stop rules.
- Convert vague strategy notes into scoped implementation tasks.

## Model Adapters

The same packet can be adapted to different systems:

| System | What to emphasize |
|---|---|
| Codex | file paths, commands, diffs, tests, receipts, strict edit scope |
| Claude Code | worktrees, subagents, hooks, stop conditions |
| Gemini CLI | explicit file scope, structured output, grounding |
| DeepSeek | stable prefix, JSON mode, cache-hit friendly repeated instructions |
| OpenAI Agents | tools, handoffs, tracing, eval fields, structured outputs |

## Related Work

Token Prompt Compiler is closest to these families of tools, but sits one step earlier:

| Family | What they do | How this project differs |
|---|---|---|
| Spec-driven development skills | Turn a feature idea into requirements, design, plans, and implementation steps | Token Prompt Compiler first turns messy human language into a compact task contract that any later spec workflow can consume |
| Skill Studio / automation design tools | Interview the user and export a structured automation or skill design | Token Prompt Compiler is lighter: it avoids long interviews unless boundaries are missing |
| TDD / multi-agent coding skills | Enforce test-first execution, subagent isolation, and implementation phases | Token Prompt Compiler prepares the task packet before execution so TDD workers read less context |
| Token usage auditors | Measure token usage after runs and identify expensive workflows | Token Prompt Compiler reduces waste before the run by controlling scope, tool output, and stop rules |

Useful references to study:

- Anthropic Agent Skills examples and spec: https://github.com/anthropics/skills
- Claude Code skills documentation: https://code.claude.com/docs/en/skills
- Spec-driven development skills: https://terminalskills.io/skills/spec-driven-dev
- GitHub token-efficiency workflow notes: https://github.blog/ai-and-ml/github-copilot/improving-token-efficiency-in-github-agentic-workflows/

Internal references:

- [`references/spec.md`](references/spec.md)
- [`references/adapters.md`](references/adapters.md)
- [`references/ab-test.md`](references/ab-test.md)
- [`references/related-work.md`](references/related-work.md)

## Installation

To use it as a Codex skill, clone this repository into your Codex skills directory:

```powershell
git clone https://github.com/aDragon0707/token-prompt-compiler.git C:\Users\<YOU>\.codex\skills\token-prompt-compiler
```

Or copy the folder manually:

```text
token-prompt-compiler/
  SKILL.md
  agents/openai.yaml
```

Restart Codex if the skill list does not refresh immediately.

To use it with another model, copy the `Machine Task Packet` format from this README or `SKILL.md` into that model's system/project instructions.

## Example Trigger

```text
Use token-prompt-compiler to turn my request into a token-efficient machine-readable task packet, then execute it.

[paste messy request here]
```

## Design Principles

- Less background, more boundaries.
- Less narration, more evidence.
- Less history, more current task state.
- Less full logs, more paths and excerpts.
- Less open-ended exploration, more stop rules.

## 中文

Token Prompt Compiler 用来把口语化、发散、很长的“人话需求”，压缩成更省 token、更适合机器执行的任务包。

它可以作为 Codex skill 使用，但核心思想不是只服务 Codex，而是服务所有 LLM / Agent 系统：Codex、Claude Code、Gemini CLI、DeepSeek、OpenAI Agents，或者你自己的 multi-agent runtime。

它适合 AI 编程、研究整理、写作、审查、多 agent 协作等场景。它解决的不是“少写几个字”，而是减少这些真实浪费：

- 任务边界不清，模型反复猜意图。
- 上下文太长，模型反复读历史。
- 工具输出太大，日志和 diff 直接塞进上下文。
- 没有验收标准，导致多轮返工。
- agent 自由探索，越做越偏。

## 为什么做这个

省 token 的关键不是把 prompt 写短，而是把 prompt 写成可执行的任务合同。

这个项目保留的是：

```text
目标 -> 范围 -> 输入 -> 行动 -> 证据 -> 验证 -> 停止条件
```

它会把一句模糊的话：

```text
你帮我看看这些资料，整理一下，然后想想后面怎么做。
```

编译成：

```text
Goal: Review the provided materials and produce a decision memo.
Allowed scope: Only the provided files/links.
Actions: Extract 5 useful signals, 3 risks, 3 next actions.
Evidence required: Cite file paths/URLs for each signal.
Output format: Chinese memo under 800 words.
Stop rule: Stop if required sources are unavailable.
```

## 适合什么时候用

- 你有一大段想法，但还没有变成任务。
- 你想让 Codex / Claude / Gemini / DeepSeek 少读历史、少跑偏。
- 你要把任务分给 worker agent。
- 你希望每次任务都有证据、验收和停止条件。
- 你要降低 token 消耗，但不想牺牲完成质量。

## 使用方式

你可以这样对任何模型说：

```text
先用 token-prompt-compiler，把我下面这段话翻译成你最喜欢的省 token machine-readable task packet，然后再做。

[粘贴你的自然语言需求]
```

## 模型适配

| 系统 | 重点 |
|---|---|
| Codex | 文件路径、命令、diff、测试、receipt、严格改动范围 |
| Claude Code | worktree、subagent、hooks、停止条件 |
| Gemini CLI | 明确文件范围、结构化输出、grounding |
| DeepSeek | 稳定前缀、JSON mode、利于缓存命中的重复指令 |
| OpenAI Agents | tools、handoff、trace、eval、structured outputs |

## 可参考的类似方向

这个项目和下面几类工具相近，但它更前置：

| 类型 | 它们做什么 | 我们的差异 |
|---|---|---|
| Spec-driven development skills | 把功能想法变成需求、设计、计划、实现步骤 | 我们先把混乱人话编译成一个紧凑任务合同，后续 spec workflow 可以吃这个合同 |
| Skill Studio / 自动化设计工具 | 通过访谈收集需求，再导出 skill 或自动化设计 | 我们更轻，不做长访谈，除非任务边界真的缺失 |
| TDD / 多 agent 编码技能 | 强制测试优先、subagent 隔离、分阶段实现 | 我们发生在执行前，让 TDD worker 少读上下文 |
| Token usage auditor | 运行后统计 token，找最贵 workflow | 我们在运行前减少浪费：控制范围、工具输出和停止条件 |

值得研究：

- Anthropic Agent Skills examples and spec: https://github.com/anthropics/skills
- Claude Code skills documentation: https://code.claude.com/docs/en/skills
- Spec-driven development skills: https://terminalskills.io/skills/spec-driven-dev
- GitHub token-efficiency workflow notes: https://github.blog/ai-and-ml/github-copilot/improving-token-efficiency-in-github-agentic-workflows/

## 核心判断

好的 prompt 不是越短越好，而是：

```text
少背景，多边界；
少过程，多证据；
少闲聊，多验收；
少历史，多当前任务；
少完整日志，多路径和摘要。
```
