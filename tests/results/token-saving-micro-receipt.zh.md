# Token Saving Micro Receipt

Date: 2026-05-15

Task: decide honest token-saving claim and next action.

Facts:
- Prior direct-packet tests failed: small 0.102385 -> 0.127040, quality 9 -> 8; large 0.146690 -> 0.147965, quality 8 -> 7; compact 0.142465 -> 0.168145, quality 8 -> 7.
- Context-saving test passed: full context A 0.493160 / quality 9; receipt B 0.032960 / quality 8; cost saving 93.3%.

Rules:
- Pass if cost saving >=25%, quality_delta >= -1, task_passed=true.
- Quality score and token saving are separate.
- Judge provider total cost, not visible length.

Claim:
- Safe: saves cost when broad context is replaced by a compact receipt + minimal task.
- Unsafe: every Machine Task Packet saves tokens.

Next: test even smaller micro receipt and then patch docs if quality stays usable.
