# 小问题 A/B 测试 V2：公平版

目的：

```text
验证 Machine Task Packet 是否在“同样要求 3 点建议”的条件下，
仍然比原始人话更稳定、更少跑偏、更容易验收。
```

V1 的问题：

```text
A 组自由输出了 6 条，B 组被要求 exactly 3 points。
这会让 B 天然更短，不够公平。
```

V2 修正：

```text
A 组也要求只给 3 点。
B 组仍然使用 Machine Task Packet。
```

## 固定条件

两个窗口都使用：

```text
同一个模型
同一个 reasoning effort
同一个工作目录：D:\GitHub\token-prompt-compiler
同一个文件：D:\GitHub\token-prompt-compiler\README.md
不要联网
不要改文件
只输出分析结果
```

## A 组：原始人话，但公平限制 3 点

把下面复制到一个新窗口：

```text
你帮我看看 D:\GitHub\token-prompt-compiler\README.md，这个项目我想让别人更容易理解，也方便后面测试是不是真的省 token。别改文件，不要联网，只看 README。请只给我 3 个最重要的小改进建议，每个建议说明问题、为什么重要、最小修改办法。回答用中文，尽量简洁，不要泛泛而谈。
```

## B 组：Machine Task Packet

把下面复制到另一个新窗口：

```text
Machine Task Packet
Goal: Review D:\GitHub\token-prompt-compiler\README.md and identify exactly 3 small improvements that make the project easier to understand, test, or share.
Why now: We are testing whether structured task packets improve agent focus and reduce wasted output.
Allowed scope: Read only D:\GitHub\token-prompt-compiler\README.md.
Read first:
- D:\GitHub\token-prompt-compiler\README.md
Do not touch:
- Do not edit files.
- Do not inspect unrelated files.
- Do not browse the web.
Actions:
- Identify exactly 3 improvement points.
- For each point, explain the issue, why it matters, and the smallest fix.
- Prefer concrete README changes over broad strategy advice.
Evidence required:
- Refer to the README section or wording behind each point.
Verification:
- Output has exactly 3 points.
- Each point has Issue / Why it matters / Smallest fix.
- No file edits were made.
Output format:
- Chinese.
- Under 450 words.
- Use this structure for each point: Issue / Why it matters / Smallest fix.
Stop rule:
- Stop after reading README.md once.
- If README.md is unavailable, report that and stop.
Token policy:
- Do not summarize the whole README.
- Do not repeat project background.
- Do not produce a full rewrite.
- Do not add extra sections after the 3 points.
Adapter notes:
- For Codex: use one targeted file read, no edits, concise final answer only.
```

## 你要记录什么

如果界面没有真实 token 数，就记录行为指标：

| 指标 | A 原始人话 | B Task Packet |
|---|---:|---:|
| 是否只读 README |  |  |
| 是否改文件 |  |  |
| 是否联网 |  |  |
| 是否 exactly 3 points |  |  |
| 是否每点都有 Issue / Why / Fix |  |  |
| 是否出现额外总结/跑题 |  |  |
| 输出字数约估 |  |  |
| 工具调用次数 |  |  |
| 质量分 0-10 |  |  |

## 质量评分

10 分制：

```text
2 分：只给 3 个 README 改进点
2 分：每点具体可执行
2 分：能对应 README 内容
2 分：遵守只读 README / 不改文件 / 不联网
2 分：简洁，不加额外废话
```

## 判断标准

如果 B 的质量不低于 A，并且：

```text
更少跑题
更少额外解释
更稳定遵守格式
更容易直接进入下一步修改
```

就说明 skill 有用。

如果 A 和 B 差不多：

```text
说明对于很小、边界已经清楚的任务，task packet 的收益有限。
```

这也是正常结论，因为 token-prompt-compiler 的最大价值在：

```text
复杂任务
多文件任务
长需求
多人/多 agent 交接
需要证据和验收的任务
```

