# SACP Handoff: ECC Learning -> Three-Skill System Upgrade

Use this handoff to start the next Codex run without rereading this whole conversation.

## SACP Packet

### S — State

Local repos:

- `D:\GitHub\token-prompt-compiler`
- `D:\GitHub\agent-cost-router`
- `D:\GitHub\everything-claude-code`

Local skills:

- `C:\Users\86181\.codex\skills\agent-cost-router`
- `C:\Users\86181\.codex\skills\token-prompt-compiler`
- `C:\Users\86181\.codex\skills\audit-evolution`

Current system:

```text
agent-cost-router      = pre-task routing, model/context budget, probes
token-prompt-compiler  = Tiny Packet / Micro Receipt / Worker Packet
audit-evolution        = Tiny Audit / continuity / clean-state packet
```

Recent evidence:

- Context-saving test passed: full context cost `$0.493160`, receipt cost `$0.032960`, quality `9 -> 8`, saving `93.3%`.
- Micro Receipt test passed: full receipt cost `$0.034845`, micro receipt cost `$0.017415`, quality `8 -> 8`, saving `50.0%`.
- Strict output formatting can backfire: visible output may shrink while provider `output_tokens` rises.
- Cache read reduces repeated-prefix cost, but Micro Receipt avoids sending the long prefix.

ECC repo finding:

- `everything-claude-code` is a large harness, not one skill: 60 agents, 229 skills, 75 commands, 110 rules, 158 scripts, 140 tests.
- ECC is stronger as a full agent OS.
- Our system is sharper for per-task context economy.

### A — Aim

Absorb useful ideas from `everything-claude-code` without bloating our skills.

Target outcome:

```text
Keep our three-skill system small.
Borrow only reusable patterns:
- DAILY / LIBRARY install-surface classification
- atomic instinct + confidence learning
- harness scorecard / before-after deltas
- cost-aware pipeline language where it fits
```

Deliverables:

1. `agent-cost-router`: add optional DAILY/LIBRARY and scorecard routing if useful.
2. `token-prompt-compiler`: add any missing receipt/packet pattern only if it stays small.
3. `audit-evolution`: add atomic learning / confidence idea only if it improves tiny audit.
4. A short comparison receipt: what we borrowed, what we rejected, why.

### C — Constraints

Do not:

- Do not merge all skills into one big skill.
- Do not copy ECC wholesale.
- Do not load all 2,000+ ECC files.
- Do not turn our skills into a giant agent harness.
- Do not claim we are globally better than ECC.

Allowed reads first:

- `D:\GitHub\everything-claude-code\skills\agent-sort\SKILL.md`
- `D:\GitHub\everything-claude-code\skills\continuous-learning-v2\SKILL.md`
- `D:\GitHub\everything-claude-code\skills\cost-aware-llm-pipeline\SKILL.md`
- `D:\GitHub\everything-claude-code\agents\harness-optimizer.md`
- `D:\GitHub\everything-claude-code\skills\agent-eval\SKILL.md`
- `D:\GitHub\everything-claude-code\skills\agentic-engineering\SKILL.md`
- `D:\GitHub\token-prompt-compiler\SKILL.md`
- `D:\GitHub\agent-cost-router\SKILL.md`
- `C:\Users\86181\.codex\skills\audit-evolution\SKILL.md`

Stop if:

- More than 8 ECC files seem necessary before producing a receipt.
- A proposed patch increases any SKILL.md by more than about 80 lines.
- The task turns into generic ECC documentation instead of improving our three-skill system.

### P — Protocol

Start with `agent-cost-router`.

Route:

```text
route: ECC pattern absorption
model_choice: Codex main for final judgment; local Claude Code workers for narrow extraction
token_policy: Micro Receipt first, no broad repo scan, full files by path only
skill_chain: agent-cost-router -> token-prompt-compiler -> Claude workers -> audit-evolution
next_action: create 3 worker receipts, then decide minimal patches
stop_rule: stop before broad copy or large skill expansion
```

Then use `token-prompt-compiler` only to produce worker packets.

After patches/tests, use `audit-evolution` Tiny Audit only.

## How To Start Next Codex

Paste this:

```text
Use agent-cost-router + token-prompt-compiler + audit-evolution.

Read only:
- D:\GitHub\token-prompt-compiler\handoffs\sacp-next-codex-ecc-learning.md

Goal:
Absorb useful patterns from D:\GitHub\everything-claude-code into our three-skill system without bloating it.

Process:
1. Follow the SACP handoff.
2. Spawn or run local Claude Code workers only for narrow extraction.
3. Produce 3 short receipts.
4. Patch only if a pattern clearly improves agent-cost-router, token-prompt-compiler, or audit-evolution.
5. Commit/push changes if safe.

Output:
- changed files
- borrowed patterns
- rejected patterns
- tests/validation
- Tiny Audit
```

## Local Claude Code Worker Prompts

Use `--bare` when possible to reduce local harness overhead.

### Worker 1 — ECC Router Patterns

```powershell
claude --bare -p @"
Use only these files:
- D:\GitHub\everything-claude-code\skills\agent-sort\SKILL.md
- D:\GitHub\everything-claude-code\skills\cost-aware-llm-pipeline\SKILL.md
- D:\GitHub\everything-claude-code\agents\harness-optimizer.md

Task:
Extract patterns that could improve a tiny agent-cost-router skill.

Return <=300 Chinese chars:
1. useful patterns
2. reject patterns
3. exact proposed patch idea
4. risk if adopted
"@ --output-format json --tools "" --permission-mode dontAsk
```

### Worker 2 — ECC Learning / Audit Patterns

```powershell
claude --bare -p @"
Use only:
- D:\GitHub\everything-claude-code\skills\continuous-learning-v2\SKILL.md
- C:\Users\86181\.codex\skills\audit-evolution\SKILL.md

Task:
Compare ECC atomic instinct/confidence learning with our audit-evolution Tiny Audit.

Return <=300 Chinese chars:
1. one pattern worth borrowing
2. one thing to reject
3. where to patch audit-evolution, if any
4. keep-token-small warning
"@ --output-format json --tools "" --permission-mode dontAsk
```

### Worker 3 — ECC Eval / Evidence Patterns

```powershell
claude --bare -p @"
Use only:
- D:\GitHub\everything-claude-code\skills\agent-eval\SKILL.md
- D:\GitHub\everything-claude-code\skills\agentic-engineering\SKILL.md
- D:\GitHub\token-prompt-compiler\references\ab-test.md

Task:
Extract eval/scorecard ideas that could improve our token/cost/quality tests.

Return <=300 Chinese chars:
1. useful scorecard fields
2. what not to import
3. proposed minimal schema patch
4. pass/fail rule improvement
"@ --output-format json --tools "" --permission-mode dontAsk
```

## Minimal Task Split

1. `extract-router-patterns`
   - Read only Worker 1 receipt.
   - Patch `D:\GitHub\agent-cost-router\SKILL.md` only if the patch is under 40 lines.

2. `extract-audit-patterns`
   - Read only Worker 2 receipt.
   - Patch local `audit-evolution` only if it improves Tiny Audit without adding long sections.

3. `extract-eval-patterns`
   - Read only Worker 3 receipt.
   - Patch `D:\GitHub\token-prompt-compiler\references\ab-test.md` or `references/api-ab-test.md`.

4. `sync-local-skills`
   - If `agent-cost-router` or `token-prompt-compiler` changes, copy updated `SKILL.md` into `C:\Users\86181\.codex\skills\...`.

5. `validate`
   - Run `quick_validate.py` for changed local skills.
   - Run `node --check` for changed scripts.
   - Check git status.

6. `commit`
   - Commit each repo separately.
   - Push only clean, scoped changes.

## Decision Rules

Borrow if:

- it reduces route ambiguity;
- it lowers context loaded by default;
- it adds measurable cost/quality evidence;
- it fits under a small section.

Reject if:

- it requires hooks/daemons/installers to be useful;
- it expands our skills into a harness;
- it duplicates existing router/compiler/audit roles;
- it adds broad rules that trigger on every task.

## Final Response Shape

```text
Done:
- files changed
- commits pushed

Borrowed:
- pattern -> where applied

Rejected:
- pattern -> why

Validation:
- commands/results

Tiny Audit:
evidence:
correction:
one_evolution:
next_check:
stop_or_continue:
```
