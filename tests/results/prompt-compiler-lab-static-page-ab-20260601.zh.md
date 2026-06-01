# Prompt Compiler Lab Static Page A/B Result

Date: 2026-06-01

Purpose: record a counterintuitive single-run result where the uncompiled human prompt produced a stronger static webpage than the compiled prompt.

This is a negative-control style case. It should not be used to claim that prompt compilation is harmful. It shows that prompt compilation without hard validation can underperform a strong agent's default product-building behavior.

## Test Setup

Task:

```text
Create a single-file static webpage for Prompt Compiler Lab.
It should help users turn messy intent into GPT/Claude-ready prompts.
```

Variant A:

```text
Original broad human-language request, no compiled prompt packet.
```

Variant B:

```text
Compiled/optimized prompt with explicit sections and constraints.
```

Fixed expectation:

```text
Single HTML file, no frontend framework, input area, Prompt IR or structured prompt area, GPT/Claude outputs, lint score, validator checklist, mobile support.
```

## Evidence Observed

Variant A produced a richer self-contained tool:

- GPT / Claude / general mode switching.
- Structured prompt output.
- Copy and tighten controls.
- Automatic scoring.
- Validator checklist.
- Secret redaction with `[REDACTED_SECRET]`.
- Mobile responsive CSS.
- Reported Node and Playwright verification.

Variant B produced a cleaner but narrower tool:

- Single-file static page.
- Rough notes input.
- Compiled prompt output.
- Quality score.
- Basic checklist.
- Mobile responsive CSS.
- No clear separate Prompt IR / GPT version / Claude version areas.
- No visible secret redaction.
- No tighten/compression action.
- No reported browser or parser verification.

Static feature check from the evaluation session:

| Check | A: broad prompt | B: compiled prompt |
|---|---:|---:|
| textarea input | pass | pass |
| tool-like panel layout | pass | pass |
| GPT support | pass | pass |
| Claude support | pass | pass |
| general mode | pass | fail |
| secret redaction | pass | fail |
| copy action | pass | pass |
| tighten/compress action | pass | fail |
| mobile media query | pass | pass |
| no React/Vue/Next dependency | pass | pass |

Estimated rubric score:

| Variant | Score | Reason |
|---|---:|---|
| A | 16-17 / 18 | More complete feature coverage and verification evidence |
| B | 11-12 / 18 | Valid static page, but missed several requested product behaviors |

## Why This Is Strange

The compiled prompt looked more professional, but the broad prompt performed better.

Likely causes:

1. The broad prompt left room for the agent's latent product-building heuristics.
   - Codex already has strong frontend and tool-building priors.
   - With fewer narrow constraints, it over-delivered useful controls.

2. The compiled prompt improved structure but did not make validation hard enough.
   - "Include Prompt IR / GPT / Claude" was semantically present, but not machine-checked.
   - The model could satisfy the task in spirit while missing exact visible sections.

3. The test measured final artifact quality, not prompt aesthetics.
   - A better-looking prompt is not necessarily a better execution contract.
   - The useful unit is prompt + validator + repair loop.

4. The broad run reported stronger verification.
   - A included parser and browser checks.
   - B did not show equivalent evidence.

5. This is a single-run result.
   - It is signal, not proof.
   - Re-run with fixed model, same environment, and strict verifier before making broad claims.

## Compiler Lesson

Prompt compilation should not stop at clean wording.

For artifact-building tasks, the compiled prompt should include a hard final gate:

```text
Before final answer, verify:
- The page visibly contains separate Prompt IR, GPT/OpenAI version, and Claude version areas.
- The page includes secret redaction using [REDACTED_SECRET].
- The page includes a validator checklist.
- The page includes responsive CSS.
- No framework dependency is used.

If any item is missing, revise before final.
```

Better yet, include a scriptable check:

```text
Validation command:
- Check HTML contains: Prompt IR, GPT/OpenAI, Claude, [REDACTED_SECRET], @media.
- Check no React/Vue/Next/CDN dependency.
- Check JS syntax is valid.
```

## Claim Boundary

Safe claim:

```text
This example shows that structured prompts need executable validators to outperform strong default agent behavior reliably.
```

Unsafe claim:

```text
Compiled prompts are worse than natural prompts.
```

Next test:

```text
Run A/B/C:
A = broad human prompt
B = compiled prompt without hard validator
C = compiled prompt with hard validator and self-repair gate
```

