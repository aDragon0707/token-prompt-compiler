# Token Prompt Compiler

**English** | [中文](#中文)

Token Prompt Compiler turns messy human-language requests into token-efficient Prompt IR, machine-readable task packets, linted prompts, and GPT/OpenAI or Claude adapters for LLMs and agent systems.

Think of it as a **pre-flight checklist for agents**: scope, evidence, verification, and stop rules before the model starts working.

It works as a Codex skill, but the core idea is model-agnostic: compile human intent into a compact contract that Codex, Claude Code, OpenAI/GPT, Claude, Gemini CLI, DeepSeek, or another LLM agent can execute with less wasted context.

## 30-Second Quick Start

Paste this into Codex, Claude, Gemini, DeepSeek, or another agent:

```text
Use token-prompt-compiler to compile this request into a token-efficient Machine Task Packet, then execute it:

[your messy request]
```

For prompt optimization instead of execution:

```text
Use token-prompt-compiler to turn this messy request into Prompt IR, then produce GPT/OpenAI and Claude versions with a validator checklist:

[your messy prompt]
```

Tiny example:

```text
Input: Help me review this README and make it easier to test.

Output:
Goal: Review README.md for testability.
Allowed scope: README.md only.
Actions: Find 3 small improvements.
Evidence required: Refer to the relevant README sections.
Stop rule: Do not edit files.
```

## Why

Most prompt optimization focuses on making prompts shorter. This project focuses on making prompts more machine-readable and executable.

The goal is not simply to reduce words. The goal is to preserve the decision surface:

```text
goal -> scope -> inputs -> actions -> evidence -> verification -> stop rule
```

This helps LLM agents spend fewer tokens guessing intent, rereading history, exploring irrelevant files, or producing long unsupported summaries.

## How Token Savings Actually Happen

The packet format alone does not guarantee lower token use. On small, already-scoped tasks, a task packet can increase `input_tokens`.

The strongest savings come from **context control**:

```text
full docs / logs / history stay on disk
-> compact Evidence Receipt goes into the prompt
-> minimum task packet tells the model what to do next
-> provider usage verifies the result
```

Use three packet tiers:

| Tier | Use when | Shape |
|---|---|---|
| Tiny | Single-file, clear task | Goal / Actions / Stop rule |
| Standard | Most reviews and small implementation tasks | Goal / Scope / Actions / Evidence / Output / Stop |
| Full | Multi-file, tool-using, multi-agent, high-risk work | Full Machine Task Packet |

Measured local Claude Code result for a context-saving test:

| Variant | Input strategy | input | output | cost | quality |
|---|---|---:|---:|---:|---:|
| A | Full documents and full result logs | 31,289 | 4,159 | $0.493160 | 9/10 |
| B | Evidence Receipt + minimum protocol | 1,129 | 377 | $0.032960 | 8/10 |

Result: B reduced total cost by 93.3% while quality dropped by 1 point. This supports the narrower claim: token-prompt-compiler can save cost when it replaces broad context with a compact evidence receipt and a minimum task contract. It does **not** prove every Machine Task Packet saves tokens.

Further local reduction with Claude Code:

```text
Use bare/minimal runtime when available.
Fix the model during measurement.
Use a Micro Receipt for final claim-boundary tasks.
Avoid rigid line/character constraints that can increase provider output_tokens.
```

Measured follow-up:

| Variant | Runtime | input | output | cost | quality |
|---|---|---:|---:|---:|---:|
| A | bare + full receipt | 1,241 | 471 | $0.034845 | 8/10 |
| B | bare + Micro Receipt | 483 | 282 | $0.017415 | 8/10 |

Result: Micro Receipt reduced cost by 50.0% with no quality loss in that run. A stricter "4 lines / max characters" variant looked shorter but cost more, so judge provider usage, not visible length.

### Cache vs Receipt

Prompt caching is useful, but it is not the same as context reduction:

```text
cache hit = repeated long context becomes cheaper
Micro Receipt = long context is not sent unless needed
```

Best default:

```text
stable short prefix -> Micro Receipt -> current task
```

If a request shows high `cached_tokens`, you may have saved compute compared with a cold long prompt, but you may still be paying more than a short receipt-based prompt. Record cached tokens separately and judge total provider cost.

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

For prompt work, it also compiles:

```text
messy human request
-> Prompt IR
-> GPT/OpenAI or Claude adapter
-> lint score
-> validator checklist
```

Phase 1 focuses deeply on GPT/OpenAI and Claude. Gemini CLI, GitHub Models, and DeepSeek are kept as reserved adapter stubs.

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

Short field guide:

| Field | Meaning |
|---|---|
| `Why now` | The urgency or context for doing this task now |
| `Read first` | The first 3-5 inputs the agent should inspect |
| `Evidence required` | What proves the answer or completion |
| `Stop rule` | When the agent should stop instead of drifting |
| `Token policy` | How to avoid wasted context, logs, and output |
| `Adapter notes` | Model-specific hints for Codex, Claude Code, Gemini, DeepSeek, or OpenAI Agents |

For full field semantics, see [`SPEC.md`](SPEC.md) and [`references/spec.md`](references/spec.md).

## Installation

To use it as a Codex skill, clone this repository into your Codex skills directory.

Windows:

```powershell
git clone https://github.com/aDragon0707/token-prompt-compiler.git C:\Users\<YOU>\.codex\skills\token-prompt-compiler
```

macOS / Linux:

```bash
git clone https://github.com/aDragon0707/token-prompt-compiler.git ~/.codex/skills/token-prompt-compiler
```

Or copy the folder manually:

```text
token-prompt-compiler/
  SKILL.md
  agents/openai.yaml
  references/
```

Restart Codex if the skill list does not refresh immediately.

Required files:

```text
SKILL.md is required.
references/ should be kept for Prompt IR, lint rubric, adapters, official-tool notes, spec, and A/B testing details.
agents/openai.yaml is optional UI metadata for Codex-like environments.
```

Minimum verification:

```text
Confirm that token-prompt-compiler appears in your skill list, or run the Example Trigger below.
```

To use it with another model, copy the `Machine Task Packet` format from this README or `SKILL.md` into that model's system/project instructions.

## Example Trigger

```text
Use token-prompt-compiler to turn my request into a token-efficient machine-readable task packet, then execute it.

[paste messy request here]
```

## How to Test Token Savings

Use an A/B test:

```text
A: original human-language prompt
B: compiled Machine Task Packet
Fixed conditions: same model, same files, same reasoning effort, same output limit
Measure: input_tokens, cached_tokens, output_tokens, reasoning_tokens, tool_calls, files_read, retries, quality_score
Pass rule: B saves at least 25% total tokens while quality drops by no more than 1 point
```

Reproducible scoring:

```text
total_tokens = input_tokens + output_tokens + reasoning_tokens
cached_tokens are recorded separately
quality_score = 0-10, scored by the same reviewer with the same rubric
visible answer length is recorded separately from provider output_tokens
```

Result table:

| Variant | input | cached | output | reasoning | total | tool_calls | files_read | retries | quality | pass |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A original prompt |  |  |  |  |  |  |  |  |  |  |
| B task packet |  |  |  |  |  |  |  |  |  |  |

Start here:

- [Basic English example](examples/basic.en.md)
- [Basic Chinese example](examples/basic.zh.md)
- [README A/B test](tests/small-task-ab-test.zh.md)
- [A/B protocol](references/ab-test.md)

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

## Design Principles

- Less background, more boundaries.
- Less narration, more evidence.
- Less history, more current task state.
- Less full logs, more paths and excerpts.
- Less open-ended exploration, more stop rules.

## Related Work

Token Prompt Compiler is closest to these families of tools, but sits one step earlier:

| Family | What they do | How this project differs |
|---|---|---|
| Spec-driven development skills | Turn a feature idea into requirements, design, plans, and implementation steps | Token Prompt Compiler first turns messy human language into a compact task contract that any later spec workflow can consume |
| Skill Studio / automation design tools | Interview the user and export a structured automation or skill design | Token Prompt Compiler is lighter: it avoids long interviews unless boundaries are missing |
| TDD / multi-agent coding skills | Enforce test-first execution, subagent isolation, and implementation phases | Token Prompt Compiler prepares the task packet before execution so TDD workers read less context |
| Token usage auditors | Measure token usage after runs and identify expensive workflows | Token Prompt Compiler reduces waste before the run by controlling scope, tool output, and stop rules |

Useful references:

- Anthropic Agent Skills examples and spec: https://github.com/anthropics/skills
- Claude Code skills documentation: https://code.claude.com/docs/en/skills
- Spec-driven development skills: https://terminalskills.io/skills/spec-driven-dev
- GitHub token-efficiency workflow notes: https://github.blog/ai-and-ml/github-copilot/improving-token-efficiency-in-github-agentic-workflows/

Internal references:

- [`references/spec.md`](references/spec.md)
- [`references/adapters.md`](references/adapters.md)
- [`references/ab-test.md`](references/ab-test.md)
- [`references/related-work.md`](references/related-work.md)

## Encoding

All Markdown files in this repository are intended to be UTF-8. If Chinese text appears garbled locally, reopen the file as UTF-8.

## 中文

Token Prompt Compiler 用来把口语化、发散、很长的“人话需求”，压缩成更省 token、更适合机器执行的任务包。

它不是“压缩文字”，而是把人话需求编译成 agent 开工前的任务合同：范围、证据、验证方式和停止条件先写清楚，再让模型执行。

它可以作为 Codex skill 使用，但核心思想不是只服务 Codex，而是服务所有 LLM / Agent 系统：Codex、Claude Code、Gemini CLI、DeepSeek、OpenAI Agents，或者你自己的 multi-agent runtime。

## 30 秒上手

把这段粘贴给 Codex、Claude、Gemini、DeepSeek 或其他 agent：

```text
Use token-prompt-compiler to compile this request into a token-efficient Machine Task Packet, then execute it:

[your messy request]
```

极短示例：

```text
Input: 帮我审查这个 README，让它更容易测试。

Output:
Goal: Review README.md for testability.
Allowed scope: README.md only.
Actions: Find 3 small improvements.
Evidence required: Refer to the relevant README sections.
Stop rule: Do not edit files.
```

## 为什么

省 token 的关键不是把 prompt 写短，而是把 prompt 写成可执行的任务合同。

这个项目保留的是：

```text
目标 -> 范围 -> 输入 -> 行动 -> 证据 -> 验证 -> 停止条件
```

它减少的是这些真实浪费：

- 任务边界不清，模型反复猜意图。
- 上下文太长，模型反复读历史。
- 工具输出太大，日志和 diff 直接塞进上下文。
- 没有验收标准，导致多轮返工。
- agent 自由探索，越做越偏。

## 做什么

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

## 输出格式

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

几个不直观字段：

| 字段 | 含义 |
|---|---|
| `Why now` | 为什么现在要做这件事 |
| `Read first` | agent 最先应该读的 3-5 个入口 |
| `Evidence required` | 什么证据能证明结论或完成状态 |
| `Stop rule` | 什么时候必须停下，避免跑偏 |
| `Token policy` | 怎么避免浪费上下文、日志和输出 |
| `Adapter notes` | 针对 Codex、Claude Code、Gemini、DeepSeek、OpenAI Agents 的执行提示 |

## 怎么用

你可以这样对任何模型说：

```text
先用 token-prompt-compiler，把我下面这段话翻译成你最喜欢的省 token machine-readable task packet，然后再做。

[粘贴你的自然语言需求]
```

## 怎么测试

用 A/B 测试：

```text
A: 原始人话 prompt
B: 编译后的 Machine Task Packet
固定条件：同一个模型、同一批文件、同一个 reasoning effort、同一个输出长度限制
记录指标：input_tokens、cached_tokens、output_tokens、reasoning_tokens、tool_calls、files_read、retries、quality_score
通过标准：B 至少减少 25% total tokens，并且质量下降不超过 1 分
```

可复现评分：

```text
total_tokens = input_tokens + output_tokens + reasoning_tokens
cached_tokens 单独记录
quality_score = 1-5 分，由同一个评审按同一套标准打分
```

结果表：

| Variant | input | cached | output | reasoning | total | tool_calls | files_read | retries | quality | pass |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A 原始 prompt |  |  |  |  |  |  |  |  |  |  |
| B task packet |  |  |  |  |  |  |  |  |  |  |

快速入口：

- [英文基础示例](examples/basic.en.md)
- [中文基础示例](examples/basic.zh.md)
- [README A/B 测试](tests/small-task-ab-test.zh.md)
- [A/B 测试协议](references/ab-test.md)

## 模型适配

| 系统 | 重点 |
|---|---|
| Codex | 文件路径、命令、diff、测试、receipt、严格改动范围 |
| Claude Code | worktree、subagent、hooks、停止条件 |
| Gemini CLI | 明确文件范围、结构化输出、grounding |
| DeepSeek | 稳定前缀、JSON mode、利于缓存命中的重复指令 |
| OpenAI Agents | tools、handoff、trace、eval、structured outputs |

## 设计原则

- 少背景，多边界。
- 少过程，多证据。
- 少闲聊，多验收。
- 少历史，多当前任务。
- 少完整日志，多路径和摘要。

## 可参考的类似方向

这个项目和下面几类工具相近，但它更前置：

| 类型 | 它们做什么 | 我们的差异 |
|---|---|---|
| Spec-driven development skills | 把功能想法变成需求、设计、计划、实现步骤 | 我们先把混乱人话编译成一个紧凑任务合同，后续 spec workflow 可以吃这个合同 |
| Skill Studio / 自动化设计工具 | 通过访谈收集需求，再导出 skill 或自动化设计 | 我们更轻，不做长访谈，除非任务边界真的缺失 |
| TDD / 多 agent 编码技能 | 强制测试优先、subagent 隔离、分阶段实现 | 我们发生在执行前，让 TDD worker 少读上下文 |
| Token usage auditor | 运行后统计 token，找最贵 workflow | 我们在运行前减少浪费：控制范围、工具输出和停止条件 |

## 编码说明

本仓库 Markdown 文件按 UTF-8 保存。如果你在本地看到中文乱码，请用 UTF-8 重新打开。
