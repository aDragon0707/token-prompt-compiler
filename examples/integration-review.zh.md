# 示例：整合参考资料并优化 skill

## 原始需求

```text
你再来整合加优化一下，我们待会儿测一测，允许反思，推理，博弈：
Anthropic Agent Skills、Spec-driven development skill、Token usage auditor / optimizer、本地已有技能里的相邻模式。
```

## 编译后

```text
Machine Task Packet
Goal: Integrate related-work insights into Token Prompt Compiler and prepare it for A/B testing.
Why now: The project needs to become a model-agnostic human-to-machine task compiler, not only a Codex prompt helper.
Allowed scope: Token Prompt Compiler repository files only.
Read first:
- SKILL.md
- README.md
- SPEC.md
- examples/
- references/ if present
Do not touch:
- Do not change unrelated local skills.
- Do not add heavyweight scripts unless they are required for testing.
Actions:
- Keep SKILL.md concise and executable.
- Move long explanations into references loaded on demand.
- Add A/B token reduction protocol.
- Clarify positioning against spec-driven skills and token auditors.
- Preserve bilingual README.
Evidence required:
- List changed files.
- Validate the skill.
- Commit and push changes if repository is configured.
Verification:
- quick_validate.py passes.
- README explains model-agnostic positioning.
- references include spec, adapters, A/B test, related work.
Output format: Short Chinese summary with commit hash and next test suggestion.
Stop rule: Stop if validation fails or if GitHub authentication is unavailable.
Token policy: Read only project entry files first; avoid re-reading full external references unless needed.
Adapter notes: For Codex, use apply_patch for edits, validate with quick_validate.py, and report git commit.
```

