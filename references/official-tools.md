# Official Tool Adapters

Official prompt tools are optional adapters, not core dependencies. Do not call external services unless the user explicitly asks and credentials, cost, and permissions are clear.

Use this file to decide whether to mention, recommend, or plan an official tool path.

## Default Rule

```text
Base compile is local: messy request -> SACP -> optional Prompt IR -> GPT/Claude adapter -> lint/validator.
Official tools are optional: use only on explicit request or provider-comparison tasks.
```

If official tool use is requested, state:

- provider and tool name
- required account/API key/beta access
- likely cost or quota uncertainty
- what local output will be sent
- what will be verified after the tool returns

## OpenAI

Use for:

- prompt objects, versioning, templating
- structured outputs / JSON schema style contracts
- evals, graders, and prompt optimizer workflows
- GPT/OpenAI-specific prompt improvement

Local adapter behavior:

- Generate SACP first; express as Prompt IR only when adapter or eval fields need it.
- Emit Markdown-section GPT/OpenAI prompt.
- Include structured output or JSON Schema guidance when parsing matters.
- Suggest eval/optimizer use only when the user asks for official tooling.

Do not assume free optimizer API access. Treat dashboard, eval, and API capabilities as provider-dependent and verify before execution.

## Anthropic / Claude

Use for:

- Claude-oriented prompt generator/improver workflows
- XML tag organization
- examples and prefills
- eval tool workflows
- `improve_prompt` style adapters when explicitly requested

Local adapter behavior:

- Generate SACP first; express as Prompt IR only when adapter or eval fields need it.
- Emit XML-tagged Claude prompt.
- Mark untrusted data explicitly.
- Use prefill only for output shape, not conclusions.
- Mention stop sequences only as API-level option.

Do not call Anthropic prompt tools silently. Treat prompt improver and beta prompt tool APIs as optional and access-dependent.

## Google / Gemini

Reserved for later phases.

Phase 1 behavior:

- Do not deeply adapt.
- Preserve a placeholder note if user asks for Gemini.
- Suggest future Vertex/Gemini prompt optimizer evaluation only when relevant.

## GitHub Models

Reserved for later phases.

Phase 1 behavior:

- Do not emit `.prompt.yml` unless explicitly requested.
- Mention GitHub Models as a possible prompt management/eval target, not as a core adapter.

## DeepSeek

Reserved for later phases.

Phase 1 behavior:

- Do not deeply adapt.
- If needed, suggest stable prefix, compact prompt, and JSON mode when parsing matters.

## Adapter Decision Table

| User asks | Response |
|---|---|
| "Optimize this prompt" | Local lint + improved prompt; no official API |
| "Make Claude version" | Local Claude XML adapter |
| "Make GPT/Codex version" | Local GPT/OpenAI Markdown/schema adapter |
| "Use OpenAI optimizer" | Explain required credentials/cost; plan or execute only with approval |
| "Use Anthropic improver" | Explain beta/access/cost boundary; plan or execute only with approval |
| "Compare official tools" | Produce provider map and unverified/current-docs caveats |
