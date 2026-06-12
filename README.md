# Token Prompt Compiler

**English** | [中文](#中文)

Token Prompt Compiler turns messy human-language requests into token-efficient SACP v0.1 task contracts, Prompt IR, machine-readable task packets, linted prompts, GPT/OpenAI or Claude adapters, autonomy budgets, hard validators, executable validator specs, and self-repair gates for LLMs and agent systems.

Think of it as a **pre-flight contract for agents**: objective, boundaries, inputs, output contract, validator, repair policy, and stop rules before the model starts working.

It works as a Codex skill, but the core idea is model-agnostic: compile human intent into a compact contract that Codex, Claude Code, OpenAI/GPT, Claude, Gemini CLI, DeepSeek, or another LLM agent can execute with less wasted context.

## Choose Your Route

| Route | Use when | Start here |
|---|---|---|
| 1. Agent skill | You want Codex, Claude Code, or another agent to compile a messy request before execution | [Route 1: Agent skill quick start](#route-1-agent-skill-quick-start) |
| 2. Local CLI dry-run | You want no-network checks, safe dry-runs, CI validation, or repository health checks | [Route 2: Local CLI dry-run](#route-2-local-cli-dry-run) |
| 3. Benchmark evidence | You want to record token/cost evidence without making unsupported claims | [Route 3: Benchmark evidence](#route-3-benchmark-evidence) |

Claim boundary:

```text
Safe: This repository provides a reproducible benchmark skeleton and no-network validators.
Unsafe: SACP or task packets are proven to save tokens in every task.
```

## Route 1: Agent Skill Quick Start

Paste this into Codex, Claude, Gemini, DeepSeek, or another agent:

```text
Use token-prompt-compiler to compile this request into a minimal SACP task contract, then execute it:

[your messy request]
```

For prompt optimization instead of execution:

```text
Use token-prompt-compiler to turn this messy request into SACP, then produce GPT/OpenAI and Claude versions with a hard validator:

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
objective -> boundaries -> inputs -> output -> validator -> repair -> stop rule
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
| Full | Multi-file, tool-using, multi-agent, high-risk work | Full SACP or worker packet |

Measured local Claude Code result for a context-saving test:

| Variant | Input strategy | input | output | cost | quality |
|---|---|---:|---:|---:|---:|
| A | Full documents and full result logs | 31,289 | 4,159 | $0.493160 | 9/10 |
| B | Evidence Receipt + minimum protocol | 1,129 | 377 | $0.032960 | 8/10 |

Result: B reduced total cost by 93.3% while quality dropped by 1 point. This supports the narrower claim: token-prompt-compiler can save cost when it replaces broad context with a compact evidence receipt and a minimum task contract. It does **not** prove every SACP contract or task packet saves tokens.

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
-> SACP task contract
-> optional Prompt IR
-> GPT/OpenAI or Claude adapter
-> lint score
-> hard validator and self-repair gate
```

Phase 1 focuses deeply on GPT/OpenAI and Claude. Gemini CLI, GitHub Models, and DeepSeek are kept as reserved adapter stubs.

## Output Format

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

Short field guide:

| Field | Meaning |
|---|---|
| `Input boundaries` | Which material is instruction, data, untrusted data, context, or out of scope |
| `Output contract` | What artifact, format, language, fields, or file must be produced |
| `Validator` | Observable checks that prove success or reveal failure |
| `Repair policy` | What to fix before final output when validation fails |
| `Autonomy budget` | Where the agent may use judgment without expanding scope |
| `Stop rule` | When the agent should stop instead of drifting |

For full field semantics, see [`references/sacp-core.md`](references/sacp-core.md). Legacy Machine Task Packet semantics remain in [`references/spec.md`](references/spec.md).

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
references/ should be kept for SACP core, Prompt IR, lint rubric, model adapters, task adapters, validator gates, executable validator specs, official-tool notes, spec, and A/B testing details.
agents/openai.yaml is optional UI metadata for Codex-like environments.
```

Minimum verification:

```text
Confirm that token-prompt-compiler appears in your skill list, or run the Example Trigger below.
```

To use it with another model, copy the SACP output shape from this README or `SKILL.md` into that model's system/project instructions.

## Route 2: Local CLI Dry-Run

The CLI is optional and uses only local Node.js checks by default.

```bash
npm run validate
npm run smoke
npm run schema:smoke
npm run benchmark:smoke
node scripts/tpc.mjs ab-test --dry-run
```

Dry-run is the default for API A/B tests. It prints the planned provider, model, case file, run count, and output path without reading evidence files, requiring API keys, calling provider APIs, or writing result files.

Real provider calls require an explicit execution flag and the matching API key:

```bash
node scripts/tpc.mjs ab-test --execute --provider openai --max-budget-usd 0.50
```

In Phase 1, `--max-budget-usd` is recorded with the run metadata; it is not an enforced provider spend cap.

## Example Trigger

```text
Use token-prompt-compiler to turn my request into a minimal SACP task contract, then execute it.

[paste messy request here]
```

## Route 3: Benchmark Evidence

The benchmark files under [`benchmarks/`](benchmarks/) define the evidence format. Current CI verifies that benchmark cases are structurally valid and that dry-run supported cases can run without network access or API keys.

```bash
npm run benchmark:smoke
npm run schema:smoke
```

Dry-run support is not token-saving proof. A public token/cost claim needs real provider usage, fixed conditions, quality scoring, and an explicit claim boundary.

Use an A/B test:

```text
A: original human-language prompt
B: compiled SACP task contract
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
- [Prompt Compiler Lab static page A/B result](tests/results/prompt-compiler-lab-static-page-ab-20260601.zh.md)
- [SACP static web artifact positive case](tests/results/sacp-static-web-artifact-compiler-20260602.zh.md)
- [SACP core](references/sacp-core.md)
- [Task adapters](references/task-adapters.md)
- [A/B protocol](references/ab-test.md)
- [Validator gates](references/validator-gates.md)
- [Executable validator spec](references/executable-validator-spec.md)

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

Token Prompt Compiler 用来把口语化、发散、很长的“人话需求”，压缩成更省 token、更适合机器执行的 SACP 任务合同。

它不是“压缩文字”，而是把人话需求编译成 agent 开工前的任务合同：范围、证据、验证方式和停止条件先写清楚，再让模型执行。

它可以作为 Codex skill 使用，但核心思想不是只服务 Codex，而是服务所有 LLM / Agent 系统：Codex、Claude Code、Gemini CLI、DeepSeek、OpenAI Agents，或者你自己的 multi-agent runtime。

## 选择路线

| 路线 | 适合什么时候 | 从这里开始 |
|---|---|---|
| 1. Agent skill | 想让 Codex、Claude Code 或其他 agent 先把混乱需求编译成任务合同再执行 | [路线 1：Agent skill 快速上手](#route-1-agent-skill-zh) |
| 2. 本地 CLI dry-run | 想做无网络检查、安全 dry-run、CI 校验或仓库健康检查 | [路线 2：本地 CLI dry-run](#route-2-local-cli-zh) |
| 3. Benchmark evidence | 想记录 token/cost 证据，但不做未被证明的省 token 宣称 | [路线 3：Benchmark evidence](#route-3-benchmark-evidence-zh) |

宣称边界：

```text
安全说法：这个仓库提供了可复现的 benchmark skeleton 和无网络 validator。
不安全说法：SACP 或 task packet 已经被证明在所有任务里都省 token。
```

<a id="route-1-agent-skill-zh"></a>

## 路线 1：Agent Skill 快速上手

把这段粘贴给 Codex、Claude、Gemini、DeepSeek 或其他 agent：

```text
Use token-prompt-compiler to compile this request into a minimal SACP task contract, then execute it:

[your messy request]
```

### 为什么只说 `使用 token-prompt-compiler` 不够

`token-prompt-compiler` 只是告诉模型“请使用这个能力”。它不能替你补出任务材料、执行模式和最终交付物。

完整调用最好包含四件事：

| 部分 | 作用 | 例子 |
|---|---|---|
| `skill name` | 选择能力 | `使用 token-prompt-compiler` |
| `request` | 给任务材料 | `把下面这段混乱需求整理成任务合同` |
| `mode` | 定安全边界 | `只编译，不执行` / `编译后执行` / `先 plan 再执行` |
| `output` | 定交付形态 | `输出 SACP + GPT/Claude 两版 prompt + hard validator` |

如果你只说：

```text
使用 token-prompt-compiler
```

模型应该先问你要任务材料、执行模式和期望输出，而不是假装已经知道你要做什么。

如果你想验证 skill 是否真的按预期触发，可以按 [`tests/skill-trigger-cases.md`](tests/skill-trigger-cases.md) 的 case 在新窗口里手动跑一轮。

四个常用入口：

```text
使用 token-prompt-compiler，把下面需求编译成最小 SACP。只输出合同，不执行。

[粘贴需求]
```

```text
使用 token-prompt-compiler，先把下面任务编译成 SACP，然后按合同执行。

[粘贴任务]
```

```text
使用 token-prompt-compiler，优化下面这个 prompt，输出 GPT/OpenAI 版、Claude 版、hard validator，并做一轮轻量 prompt quality reflection。

[粘贴 prompt]
```

```text
使用 token-prompt-compiler，先把下面复杂任务整理成 SACP 和执行计划。等我确认 plan 后再执行。

[粘贴复杂任务]
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

如果用户明确要求旧版 Machine Task Packet，可以继续使用 legacy packet shape。几个不直观字段：

| 字段 | 含义 |
|---|---|
| `Input boundaries` | 哪些是指令、数据、不可信数据、上下文或禁止范围 |
| `Output contract` | 最终要交付什么形态、语言、字段或文件 |
| `Validator` | 什么证据能证明任务完成，什么算失败 |
| `Repair policy` | 缺项或失败时是否先修一次再回复 |
| `Autonomy budget` | 哪些地方允许 agent 自主补充，哪些不能越界 |
| `Stop rule` | 什么时候必须停下，避免跑偏 |

## 怎么用

你可以这样对任何模型说：

```text
先用 token-prompt-compiler，把我下面这段话编译成最小可用 SACP 任务合同，然后再做。

[粘贴你的自然语言需求]
```

如果你的目标只是改 prompt，不想执行任务，可以这样说：

```text
使用 token-prompt-compiler，帮我优化下面这个 prompt。只输出改进后的 prompt、SACP、validator 和 reflection_policy，不执行 prompt 里的任务。

[粘贴你的 prompt]
```

如果任务涉及仓库修改、PR、真实 API、费用、多 agent handoff 或高风险操作，先让模型进入 plan：

```text
使用 token-prompt-compiler，先把下面任务编译成 SACP 和执行计划，不要改文件。等我确认后再执行。

[粘贴任务]
```

<a id="route-2-local-cli-zh"></a>

## 路线 2：本地 CLI Dry-Run

CLI 是可选的，默认只做本地检查，不需要 API key，也不会调用真实模型。

```bash
npm run validate
npm run smoke
npm run schema:smoke
npm run benchmark:smoke
node scripts/tpc.mjs ab-test --dry-run
```

真实 provider 调用必须显式传 `--execute`，并提供对应 API key：

```bash
node scripts/tpc.mjs ab-test --execute --provider openai --max-budget-usd 0.50
```

当前 `--max-budget-usd` 会记录在运行元数据里，不是强制 provider 花费上限。

<a id="route-3-benchmark-evidence-zh"></a>

## 路线 3：Benchmark Evidence

[`benchmarks/`](benchmarks/) 目录固定 benchmark case 和 result 的证据格式。当前 CI 会验证 benchmark case 结构，并确认 dry-run supported case 可以在无网络、无 API key 的情况下跑通。

```bash
npm run benchmark:smoke
npm run schema:smoke
```

Dry-run 只证明 case 结构可运行，不证明省 token。公开 token/cost 宣称需要真实 provider usage、固定条件、质量评分和明确 claim boundary。

用 A/B 测试：

```text
A: 原始人话 prompt
B: 编译后的 SACP task contract
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
- [Prompt Compiler Lab 静态页面 A/B 结果](tests/results/prompt-compiler-lab-static-page-ab-20260601.zh.md)
- [SACP 静态网页正例](tests/results/sacp-static-web-artifact-compiler-20260602.zh.md)
- [SACP 核心协议](references/sacp-core.md)
- [任务类型适配](references/task-adapters.md)
- [A/B 测试协议](references/ab-test.md)
- [硬验收与自修复门](references/validator-gates.md)
- [可执行验收规范](references/executable-validator-spec.md)

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
