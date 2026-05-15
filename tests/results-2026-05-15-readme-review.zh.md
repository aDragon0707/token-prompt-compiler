# A/B 测试结果：README 小问题审查

日期：2026-05-15

测试任务：

```text
只读 D:\GitHub\token-prompt-compiler\README.md，
找出 3 个可以让项目更容易被理解/测试/传播的小改进点。
```

## A 组结果摘要

A 组使用原始人话需求。

观察：

- 输出 6 条建议，覆盖更全面。
- 发现了 README 的结构问题：测试方法不够前置、Related Work 太早、安装不够跨平台、examples/tests 入口不突出、中英文结构不镜像。
- 质量高，但超出测试目标的 `exactly 3 points`。

判断：

```text
A 组更像自由审查，适合发散发现问题；
但它不够省 token，也不够遵守小任务边界。
```

## B 组结果摘要

B 组使用 Machine Task Packet。

观察：

- 严格输出 3 条。
- 遵守 Issue / Why it matters / Smallest fix 结构。
- 发现了 README 的可用性问题：乱码风险、字段解释不足、安装后缺少验证步骤。

判断：

```text
B 组更像受控审查，适合省 token 和稳定验收；
但对隐藏结构问题的覆盖面比 A 组窄。
```

## 综合结论

```text
Machine Task Packet 的优势不是让模型“更聪明”，
而是让模型少跑偏、更遵守边界、更容易验收。
```

本轮改进：

- README 前置 “How to Test Token Savings”。
- 增加 Windows / macOS / Linux 安装路径。
- 增加最小验证步骤。
- 增加 examples/tests 快速入口。
- 增加字段短说明。
- 中文部分改成镜像结构。
- 增加 UTF-8 编码说明和 `.gitattributes`。

下一轮测试建议：

```text
继续用同一测试文档跑 A/B，
重点观察 B 是否仍然严格 exactly 3 points，
以及 README 是否不再触发“测试方法不明显 / 安装不明确 / 字段解释不足”的反馈。
```

## V2 测试补充

输入：

```text
A 组和 B 组都限制 exactly 3 points。
```

共同命中问题：

- 中文链接/中文区在部分测试窗口中显示乱码。
- A/B 测试中的 `quality_score` 评分口径不够明确。

A 组额外发现：

- README 首屏缺少 “30 秒上手”。
- A/B 测试规则需要结果表，明确 `total_tokens` 怎么算。

B 组额外发现：

- Installation 需要说明关键安装文件：`SKILL.md`、`references/`、`agents/openai.yaml`。

本轮改进：

- 增加 `30-Second Quick Start` / `30 秒上手`。
- 增加 Required files。
- 增加 `total_tokens` 计算方式。
- 增加 `quality_score = 1-5` 评分说明。
- 增加 A/B result table。
- 增加 `.editorconfig`，声明 UTF-8 BOM，提升 Windows 工具识别稳定性。

