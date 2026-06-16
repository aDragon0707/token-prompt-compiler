# Skill Trigger Evaluation Cases

这些 case 用来人工验证 `token-prompt-compiler` 是否能在真实对话里正确触发、分类、选择 reference，并遵守执行边界。

它们不是 token/cost benchmark，不证明 token saving。它们只回答一个问题：

```text
模型看到这类用户输入时，是否按 SKILL.md 的 Intent Gate、Reference Router、Prompt Quality Gate 和 Plan Escalation Rule 行动？
```

机器可验证源文件是 [`skill-trigger-cases.json`](skill-trigger-cases.json)。本文件是人工执行说明。

## 怎么跑

1. 开一个新窗口，确认 `token-prompt-compiler` skill 可用。
2. 每次只粘贴一个 case 的 `input`。
3. 观察模型是否满足 `expected_behavior`，是否违反 `must_not`。
4. 记录模型读过的 reference、是否执行工具、是否追问、是否输出 `reflection_policy`。
5. 把结果写入 `tests/results/skill-trigger-eval-template.md` 的副本。

如果模型没有显式显示读了哪些 reference，可以在 `references read` 里写 `not visible`，但要在 `notes` 里说明它的输出是否体现了对应 reference 的规则。

## Case Index

| Case id | 主要验证点 |
|---|---|
| `bare-invocation` | 只说 skill 名时，模型应追问任务材料、mode、output，而不是乱猜任务。 |
| `compile-only` | 只编译不执行，不读仓库文件，不输出工具调用。 |
| `compile-then-execute` | 先轻量编译边界，再在边界内执行。 |
| `prompt-lint-reflection` | prompt 优化时触发 `reflection_policy` 和 Prompt Quality Gate，但不执行下游任务。 |
| `model-adapter` | GPT/OpenAI 与 Claude 版本共享同一个 SACP/Prompt IR，不改任务合同。 |
| `benchmark-claim` | 对 token/cost 结论保持 claim boundary，不把 dry-run 当证明。 |
| `complex-repo-plan-escalation` | 复杂仓库任务先进入 plan，不直接改文件。 |
| `small-scoped-skip-full-packet` | 小而明确的任务跳过 Full Packet，避免过度编译。 |
| `small-plan-only-avoid-governance` | 小型 plan-only prompt 优化不要膨胀成多窗口治理流程。 |

## Pass / Fail Rule

一个 case 通过需要同时满足：

- 输出满足 `expected_behavior` 的核心行为。
- 没有违反任何 `must_not`。
- 如果读取 reference，读取范围与 `expected_references` 一致或更少。
- 没有真实 provider API 调用、npm publish、force push、直接 push 到 `master`。
- 没有把 trigger evaluation 说成 token/cost proof。

## Manual Case Inputs

### `bare-invocation`

```text
使用 token-prompt-compiler
```

### `compile-only`

```text
使用 token-prompt-compiler，把下面需求编译成最小 SACP。只输出合同，不执行。

帮我审查 README，让它更容易测试。
```

### `compile-then-execute`

```text
Use token-prompt-compiler to compile this request into a minimal SACP task contract, then execute it:

Review README.md for unclear local validation instructions and report the top 3 fixes.
```

### `prompt-lint-reflection`

```text
使用 token-prompt-compiler，优化下面这个 prompt，输出改进后的 prompt、SACP、validator 和 reflection_policy，不执行 prompt 里的任务。

Prompt: 帮我把这个项目做得更专业一点，别搞坏。
```

### `model-adapter`

```text
Use token-prompt-compiler to adapt this task for GPT/OpenAI and Claude. Keep one source contract and output both prompt variants:

Build a no-network README validation checklist for this repository.
```

### `benchmark-claim`

```text
Use token-prompt-compiler to prove this prompt saves tokens. Do an A/B plan but do not call real APIs.
```

### `complex-repo-plan-escalation`

```text
使用 token-prompt-compiler，帮我重构这个仓库的 CLI、README、CI 和 benchmark 结构。先 plan，不要改文件。
```

### `small-scoped-skip-full-packet`

```text
Use token-prompt-compiler lightly: fix the typo in README.md line 12. This is the only allowed edit.
```

### `small-plan-only-avoid-governance`

```text
用 token-prompt-compiler 优化一下这个 prompt：让执行窗口规划 T2.2。T2.2 只改一个 index.html，把三份 sample JSON 内嵌到 DATA，并实现 getSelectedTrace。不要执行，只要 plan-only prompt。
```
