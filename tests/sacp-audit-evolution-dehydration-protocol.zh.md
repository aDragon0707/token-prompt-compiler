# SACP + Audit Evolution 脱水协议：Token Prompt Compiler 下一窗口启动包

用途：

```text
把当前长对话脱水成一个新窗口可直接执行的任务协议。
新窗口不需要重读整段历史，只需要读本文件和少量项目文件。
```

## 0. 新窗口直接复制这段

```text
请使用 SACP + audit-evolution 风格执行这个任务。

你现在接手的是 token-prompt-compiler 项目。不要重读整段旧对话，只读下面的脱水协议和指定文件。

目标：
验证 token-prompt-compiler 是否真的降低 token 消耗，而不只是让输出更规整。

当前已知结论：
1. 行为证据已通过：Machine Task Packet 让模型更守边界、更少跑偏、更容易验收。
2. 真实 token 数字还没证明：缺 input_tokens / output_tokens / reasoning_tokens / cached_tokens。
3. 小任务里 task packet 可能增加 input tokens，但可能减少 output、重试、工具调用和返工。
4. 下一步要做 API 级或可计量的 A/B 测试。

只读这些文件：
- D:\GitHub\token-prompt-compiler\README.md
- D:\GitHub\token-prompt-compiler\SKILL.md
- D:\GitHub\token-prompt-compiler\references\ab-test.md
- D:\GitHub\token-prompt-compiler\tests\small-task-ab-test-v2.zh.md
- D:\xwechat_files\wxid_pieku988kk8e22_e124\temp\RWTemp\2026-05\9e20f478899dc29eb19741386f9343c8\tonight-openai-deepseek-token-study(1).md

不要做：
- 不要泛泛讨论 prompt engineering。
- 不要继续只做主观 A/B。
- 不要改 README，除非发现测试协议必须改。
- 不要联网，除非我明确要求查官方文档。

输出：
1. 一个 API 级 A/B 测试方案。
2. 一个最小可运行测试脚本设计，优先支持 OpenAI usage；可选支持 DeepSeek usage。
3. 一个结果记录 JSON schema。
4. 一个通过/不通过判定规则。
5. 如果可以安全实现，就直接创建测试脚本和测试文档。

验收标准：
- 必须能记录 input_tokens / output_tokens / reasoning_tokens / cached_tokens 或说明哪个字段不可得。
- 必须把 quality_score 和 token saving 分开。
- 必须承认 task packet 可能增加 input tokens。
- 必须判断总成本，而不是只看单轮 prompt 长短。
```

## 1. SACP Packet

```yaml
sacp_version: "0.1"
message_type: "handoff_task"
project: "token-prompt-compiler"
task_id: "token-api-ab-test-001"
owner: "new_window_codex"
human_goal: "证明 token-prompt-compiler 是否真实降低 token 消耗"
current_state:
  repo: "D:\\GitHub\\token-prompt-compiler"
  github: "https://github.com/aDragon0707/token-prompt-compiler"
  latest_known_commit: "e224f9c Tighten quick start and A/B scoring"
  skill_validated: true
problem:
  - "已有行为证据，但缺真实 usage 数字"
  - "需要区分 prompt 更短、输出更短、工具调用更少、重试更少"
  - "需要避免把主观质量提升误判为 token 降低"
constraints:
  read_first:
    - "D:\\GitHub\\token-prompt-compiler\\README.md"
    - "D:\\GitHub\\token-prompt-compiler\\SKILL.md"
    - "D:\\GitHub\\token-prompt-compiler\\references\\ab-test.md"
    - "D:\\GitHub\\token-prompt-compiler\\tests\\small-task-ab-test-v2.zh.md"
    - "D:\\xwechat_files\\wxid_pieku988kk8e22_e124\\temp\\RWTemp\\2026-05\\9e20f478899dc29eb19741386f9343c8\\tonight-openai-deepseek-token-study(1).md"
  do_not:
    - "不要重读旧对话"
    - "不要泛泛讲理论"
    - "不要联网，除非用户明确批准"
    - "不要改无关文件"
required_outputs:
  - "API 级 A/B 测试方案"
  - "最小可运行脚本设计或实现"
  - "结果记录 JSON schema"
  - "通过/不通过判定规则"
evidence_required:
  - "usage 字段"
  - "quality_score rubric"
  - "A/B 固定条件"
  - "token saving 公式"
acceptance_criteria:
  - "可以运行或清楚说明缺少 API key/环境变量"
  - "能分别记录 input/output/reasoning/cached tokens"
  - "能记录 task_passed 和 quality_score"
  - "能输出 total_saving 和结论"
```

## 2. Audit Evolution Clean-State Packet

```yaml
clean_state_packet:
  current_goal: "把 token-prompt-compiler 从行为验证推进到真实 token usage 验证"
  done:
    - "创建并发布 token-prompt-compiler GitHub 仓库"
    - "将定位从 Codex prompt helper 升级为 model-agnostic human-to-machine task packet compiler"
    - "新增 README、SPEC、references、examples、tests"
    - "完成两轮 README 小任务 A/B 测试"
    - "根据测试结果优化 README、安装说明、测试规则、UTF-8 编码说明"
  evidence:
    - "A 组更发散，覆盖面广，但容易超出 exactly 3 points"
    - "B 组更收敛，严格按 Issue / Why / Fix 输出"
    - "B 组体现了边界控制和验收稳定性"
    - "尚无真实 token usage 数字"
  decisions:
    - "skill 有行为价值，但不能宣称已证明真实 token 消耗下降"
    - "下一步必须做 API 级 A/B usage 测试"
    - "评估必须同时看 token saving 和 quality_score"
  constraints:
    - "小任务里 task packet 可能增加 input tokens"
    - "应判断 total cost，而不是只看 prompt 长短"
    - "输出 token、工具调用、重试和返工也要计入收益"
  open_questions:
    - "当前环境是否有 OPENAI_API_KEY 或 DEEPSEEK_API_KEY"
    - "优先测 OpenAI 还是 DeepSeek"
    - "测试脚本是否直接跑，还是先只生成"
  next_3_actions:
    - "检查是否已有 API key 环境变量，不打印密钥"
    - "创建最小 A/B 测试脚本和样例 prompts"
    - "跑一次或给出运行命令与结果 JSON 模板"
  do_not_do:
    - "不要宣称已节省真实 token，直到 usage 证据出现"
    - "不要把 quality_score 当作 token saving"
    - "不要用长理论回答替代测试脚本"
  resume_prompt: "继续 token-prompt-compiler 的 API 级 A/B usage 测试，按 SACP packet 执行。"
```

## 3. 最小结果 JSON Schema

```json
{
  "test_id": "token-api-ab-test-001",
  "date": "",
  "provider": "openai | deepseek | other",
  "model": "",
  "fixed_conditions": {
    "temperature": 0,
    "reasoning_effort": "",
    "max_output_tokens": 0,
    "same_input_file": true,
    "same_task": true
  },
  "variants": [
    {
      "name": "A_original_prompt",
      "input_tokens": 0,
      "cached_tokens": 0,
      "output_tokens": 0,
      "reasoning_tokens": 0,
      "total_tokens": 0,
      "tool_calls": 0,
      "files_read": 0,
      "retries": 0,
      "quality_score": 0,
      "task_passed": false,
      "notes": ""
    },
    {
      "name": "B_machine_task_packet",
      "input_tokens": 0,
      "cached_tokens": 0,
      "output_tokens": 0,
      "reasoning_tokens": 0,
      "total_tokens": 0,
      "tool_calls": 0,
      "files_read": 0,
      "retries": 0,
      "quality_score": 0,
      "task_passed": false,
      "notes": ""
    }
  ],
  "computed": {
    "input_saving": 0,
    "output_saving": 0,
    "total_saving": 0,
    "quality_delta": 0,
    "verdict": "pass | warn | fail"
  }
}
```

## 4. 判定规则

```text
通过：
- B total_tokens 至少减少 25%，或
- B total_tokens 接近 A，但 retries/tool_calls/output_tokens 明显减少，且 quality_score 不下降。

警告：
- B input_tokens 增加，但 output_tokens 减少，需要看总成本。
- B 更稳但更贵，只能证明可控性，不能证明省 token。

失败：
- B total_tokens 更高，quality_score 没提升。
- B 仍然跑题或需要更多澄清。
- 无 usage 数据却宣称省 token。
```

