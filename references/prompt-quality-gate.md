# Prompt Quality Gate

Use this gate after generating a prompt, SACP packet, or model adapter output when prompt quality affects downstream execution.

## Policy

```text
reflection_policy: skip | light | full
```

| Policy | Use when | Required check |
|---|---|---|
| `skip` | The prompt is simple, one-off, and already has clear task material, boundaries, output shape, and stop rule. | No separate reflection output. |
| `light` | Normal prompt optimization, prompt review, or a medium ambiguity task packet. | Check objective, boundary, output contract, validator, and stop rule once. |
| `full` | Reusable prompt, worker handoff, multi-model adapter, compile-then-execute, benchmark claim, or high-risk execution. | Check SACP completeness, model fit, hard validator, repair path, and claim boundary. |

## Gate Checklist

Before final output, verify:

- Objective is a single clear job, not a list of wishes.
- Input boundaries say what is instruction, data, context, untrusted data, or out of scope.
- Output contract states format, language, fields, file, or artifact.
- Validator is observable: command, evidence field, source citation, screenshot, schema, or checklist item.
- Stop rule prevents scope drift, unsafe execution, missing evidence, or repeated failed attempts.
- Autonomy budget allows useful judgment without expanding scope.
- Model adapter notes change only dialect and emphasis, not the task contract.

## Output Rule

Do not expose a long reflection transcript. Return the repaired prompt or packet plus at most a short `Quality repair` note when the repair matters.

If required task material, execution mode, or desired output is missing, ask one concise question instead of guessing.

## Anti-Patterns

- Do not use reflection to perform the user's downstream task.
- Do not add a reflection section to every simple prompt.
- Do not make the final prompt longer just to show internal reasoning.
- Do not claim token savings from a cleaner prompt unless provider usage evidence exists.
