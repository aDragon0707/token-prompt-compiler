# Prompt Lint Rubric

Use this rubric when the user asks whether a prompt is good, asks to optimize/fix/rewrite a prompt, or needs a prompt adapted for GPT/OpenAI or Claude.

Score each dimension from 1 to 5. Prefer concise evidence over long critique.

Prompt lint should evaluate the SACP contract first. Surface wording is secondary unless it changes the contract.

## Scores

| Dimension | 1-2: weak | 3: usable | 4-5: strong |
|---|---|---|---|
| `clarity` | Goal is vague or mixed with side thoughts | Main task is present but has ambiguity | Concrete objective and success target |
| `boundary` | Instructions, data, context, and examples are mixed | Some labels exist but unclear trust levels | Clear data/instruction separation and untrusted input handling |
| `constraint` | Missing forbidden actions or invariants | Some constraints but incomplete | Must/avoid/preserve rules are explicit |
| `tool_fit` | Model is asked to guess facts, calculate, or execute without tools | Tools mentioned but not bounded | Tool use, approval, and fallback conditions are explicit |
| `output_contract` | Free-form prose despite downstream parsing needs | Format requested but not strict | Fields/schema/language/forbidden extras are clear |
| `validator` | No test, rubric, or acceptance criteria | Human review implied but weak | Concrete parser/test/rubric/evidence gate with repair behavior for missing items |
| `artifact_fit` | Prompt may produce a nice answer but not the requested artifact | Artifact needs are implied but not checkable | Required files, visible sections, interactions, and verification are explicit |
| `token_efficiency` | Long noisy context, repeated rules, no receipts | Some compression but still wasteful | Stable prefix, compact dynamic task, long logs by reference |
| `model_fit` | Same prompt used for every model despite format needs | Generic structure mostly works | Target adapter matches GPT/OpenAI or Claude behavior |

## Default Pass Line

Use this as the default acceptance gate:

```text
clarity >= 4
boundary >= 4
output_contract >= 4
validator >= 3
```

If any required dimension fails, output a critical gap before rewriting the prompt.

For artifact-building prompts, also require:

```text
artifact_fit >= 4
```

Treat `validator` as weak when it is only a checklist. Treat it as strong when it includes observable checks and a self-repair rule such as "if any item is missing, revise before final".

For artifact-building tasks, report both:

```text
prompt_lint_score:
artifact_quality_score:
```

Do not let a clean prompt score hide a weak artifact contract. If the prompt lacks executable verification for required files, visible sections, interactions, or forbidden dependencies, `artifact_fit` should be at most 3.

## Prompt Lint Output

```text
Prompt Lint
Scores:
- clarity:
- boundary:
- constraint:
- tool_fit:
- output_contract:
- validator:
- artifact_fit:
- token_efficiency:
- model_fit:

Critical gaps:
SACP:
Improved prompt:
Hard validator:
Validator spec:
Validation script:
Self-repair gate:
Adapter notes:
```

## Rewrite Rules

- Preserve the user's intent and original language requirements.
- Do not invent unavailable tools, evidence, files, APIs, or permissions.
- Move repeated prose into a stable prefix or schema.
- Separate untrusted data with tags or explicit data blocks.
- Turn "do a good job" into observable acceptance criteria.
- For parseable output, prefer explicit fields or schema over prose.
- For artifact-building tasks, add exact required strings, required sections, forbidden dependencies, syntax checks, or browser checks when relevant.
- Add a self-repair gate when missing requirements should be fixed before final output.
- Preserve a small autonomy budget for useful product affordances that do not violate the hard validator.
