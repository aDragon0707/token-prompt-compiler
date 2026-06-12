# Skill Eval Standards

This file records the external standards and community evidence used to design the
`token-prompt-compiler` evaluation path. It is a standards receipt, not a
benchmark result, and it is not token-saving proof.

## Claude Skills

Claude Skills use a `SKILL.md` file with YAML frontmatter and optional supporting
files such as references, scripts, and templates. Claude's documentation says the
`description` field is critical for discovery and that supporting files should be
loaded only when needed through progressive disclosure.

Implication for this repo:

- Evaluate whether the short description and Intent Gate help models choose the
  correct behavior.
- Evaluate whether routed references improve output quality enough to justify
  their extra context.
- Penalize bulk loading or reference use when a case expects no references.

Source: https://docs.claude.com/en/docs/claude-code/skills

## OpenAI Trace Grading

OpenAI's trace grading guidance focuses on structured scoring over traces: model
decisions, tool calls, guardrails, handoffs, and outputs. It recommends trace
evals for workflow-level errors rather than judging only final answers.

Implication for this repo:

- Record enough fields to reconstruct what each variant saw.
- Score behavior dimensions separately: trigger correctness, boundary following,
  reference routing, claim safety, and output usefulness.
- Keep one-shot scoring separate from future bounded agent loop scoring.

Source: https://platform.openai.com/docs/guides/trace-grading

## OpenAI Agent Evals

OpenAI's agent evals documentation frames datasets, eval runs, and graders as a
repeatable flywheel for measuring agent quality.

Implication for this repo:

- Use `tests/skill-trigger-cases.json` as a dataset.
- Keep no-network CI checks deterministic.
- Treat provider calls as local execution evidence and commit only sanitized
  summaries.

Source: https://platform.openai.com/docs/guides/agent-evals

## StepFun

StepFun documents OpenAI-compatible endpoints for both normal chat completions and
Step Plan. The normal OpenAI-compatible base URL is `https://api.stepfun.com/v1`.
The Step Plan OpenAI-compatible base URL is
`https://api.stepfun.com/step_plan/v1`.

Implication for this repo:

- Provider smoke must make the base URL visible in metadata.
- StepFun normal chat and Step Plan should not be mixed in one run unless the
  result explicitly records the base URL.
- Missing usage fields must be recorded as missing, not converted to zero.

Sources:

- https://platform.stepfun.com/docs/zh/api-reference/chat/chat-completion-create
- https://platform.stepfun.com/docs/en/guide/openai
- https://platform.stepfun.ai/docs/en/step-plan/quick-start

## TokenDance

TokenDance presents itself as an OpenAI/Claude/Gemini-compatible gateway. Public
pages mention a chat completions route under a gateway path. Because
OpenAI-compatible gateways can differ in `/models`, base path, and usage fields,
this repo treats TokenDance as configurable rather than hard-coded.

Implication for this repo:

- `TOKENDANCE_BASE_URL` is required for real TokenDance execution unless the
  default endpoint works for the user's account.
- `/models` discovery is optional; manual model lists are supported.
- Provider smoke must precede large matrix runs.

Sources:

- https://tokendance.space/models
- https://www.token.help/

## Agent skill community

Community skill evaluation discussions commonly point to three recurring risks:
skills fail to trigger, skills trigger when they should not, and agent/tool
behavior can drift when provider-compatible APIs expose different capabilities.

Implication for this repo:

- Compare A/B/C variants instead of only testing the final skill path.
- Keep provider smoke separate from skill effect eval.
- Do not promote smoke success into a benchmark claim.

Example community discussion:

- https://www.reddit.com/r/AgentSkills/comments/1r3ldih/i_built_an_opensource_tool_that_evaluates_agent/

## Claim Boundary

Safe current claim:

```text
This repository has a reproducible static skill effect evaluation harness.
```

Unsafe claim without provider usage and quality evidence:

```text
token-prompt-compiler is proven to save tokens.
```
