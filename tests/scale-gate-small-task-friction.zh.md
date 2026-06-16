# Scale Gate 压力场景：小任务被过度契约化

目的：

```text
验证 token-prompt-compiler 在小型、低风险、单文件或单动作任务中，不会把任务放大成多角色、多阶段、多窗口治理流程。
```

## 失败场景

用户说：

```text
用 token-prompt-compiler 优化一下这个 prompt，让执行窗口规划 T2.2。T2.2 只改一个 index.html，把三份 sample JSON 内嵌到 DATA，并实现 getSelectedTrace。
```

上下文：

```text
- 任务已经明确是 plan-only。
- 后续执行只会改一个文件。
- 不涉及真实 API、隐私数据、schema 修改、外部发布或复杂多 agent 交接。
```

## 不合格输出

```text
- 输出 4-5 个窗口 prompt。
- 引入独立审查员、主控放行、执行、二次审查、push 等完整治理链路。
- 对一个单文件 T2.2 小任务使用 Standard/Full SACP。
- 让用户为了一个小改动承担明显更高的流程摩擦。
```

## 合格输出

```text
- 先判断任务体量：small / medium / large。
- 对这个场景下判定为 small。
- 只输出一个 lean prompt 给执行窗口。
- 如果需要主控审查，只用一句话说明“执行窗口回 plan 后贴回主控审查”。
- 保留硬边界：不做 T2.3、不改 schemas、不引入 fetch/API/npm/React/Next/Node bridge。
```

## 通过标准

```text
输出最多包含：
1. 一个执行窗口 prompt。
2. 一个简短的后续审查说明。

不得包含：
- 多个审查窗口 prompt。
- 五步以上流程。
- 与任务风险不匹配的治理架构。
```

## 修复意图

```text
Scale Gate 不只是选择 Tiny / Standard / Full 的格式问题，
还必须控制执行摩擦。结构化输出如果增加的流程成本大于它减少的歧义，
就应该降级为更小的 prompt 或直接回答。
```
