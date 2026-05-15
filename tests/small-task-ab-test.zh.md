# 小问题 A/B 测试：原始人话 vs Machine Task Packet

目的：

```text
验证 token-prompt-compiler 是否真的减少无效探索、重复上下文和输出废话，同时不降低任务质量。
```

测试方式：

```text
A 窗口：直接发送“原始人话需求”
B 窗口：发送“Machine Task Packet”
```

两个窗口必须使用：

```text
同一个模型
同一个 reasoning effort
同一个工作目录
同一个文件
不要联网
不要改文件
只输出分析结果
```

## 测试任务

测试文件：

```text
D:\GitHub\token-prompt-compiler\README.md
```

任务类型：

```text
只读文档审查，不修改文件。
```

验收目标：

```text
找出 README 中 3 个可以让项目更容易被理解/测试/传播的小改进点。
```

## A 组：原始人话需求

把下面整段复制到一个新 Codex 窗口：

```text
你帮我看看 D:\GitHub\token-prompt-compiler\README.md，这个项目我想让别人更容易理解，也方便后面测试是不是真的省 token。你随便看看哪里还可以优化，别改文件，先给我一些建议，最好简洁点，也别太泛泛，后面我可能会发到 GitHub 给别人看。
```

## B 组：Machine Task Packet

把下面整段复制到另一个新 Codex 窗口：

```text
Machine Task Packet
Goal: Review D:\GitHub\token-prompt-compiler\README.md and identify 3 small improvements that make the project easier to understand, test, or share.
Why now: The README is the public entry point before broader testing.
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
- Avoid broad rewrites or strategy advice.
Evidence required:
- Quote or paraphrase the README section each point refers to.
Verification:
- Output has exactly 3 points.
- Each point is actionable.
- No file edits were made.
Output format:
- Chinese.
- Under 500 words.
- Use this structure: Issue / Why it matters / Smallest fix.
Stop rule:
- Stop after reading README.md once.
- If README.md is unavailable, report that and stop.
Token policy:
- Do not summarize the whole README.
- Do not repeat project background.
- Do not produce a full rewrite.
Adapter notes:
- For Codex: use one targeted file read, no edits, concise final answer only.
```

## 记录指标

跑完 A/B 后，把两个窗口的结果填到这里。

如果界面能看到 token usage，就填真实数字；如果看不到，就填可观察代理指标。

| 指标 | A 原始人话 | B Task Packet |
|---|---:|---:|
| input_tokens |  |  |
| cached_tokens |  |  |
| output_tokens |  |  |
| reasoning_tokens |  |  |
| total_tokens |  |  |
| files_read |  |  |
| tool_calls |  |  |
| retries / clarifications |  |  |
| 是否改文件 |  |  |
| 输出字数约估 |  |  |
| 是否 exactly 3 points |  |  |
| 是否可执行 |  |  |
| 质量分 0-10 |  |  |

## 质量评分

10 分制：

```text
2 分：是否完成目标，只给 README 的 3 个改进点
2 分：是否遵守范围，只读 README，不改文件
2 分：是否有证据，能对应 README 内容
2 分：是否可执行，每条都有 smallest fix
2 分：是否简洁，不泛泛扩展
```

## 通过标准

```text
B 比 A 更少工具调用或更少文件读取；
B 输出更短或更结构化；
B 没有降低质量超过 1 分；
B 没有额外澄清或跑题；
B 更符合 exactly 3 points / under 500 words / no edits。
```

## 结论模板

```text
测试日期：
模型：
reasoning effort：

A 结果：
- files_read:
- tool_calls:
- output_length:
- quality_score:
- notes:

B 结果：
- files_read:
- tool_calls:
- output_length:
- quality_score:
- notes:

结论：
- B 是否更省 token：
- 省在哪里：
- 是否损失质量：
- 下一版 task packet 要改什么：
```

