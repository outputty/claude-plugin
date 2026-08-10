# Model policy — tiered by role

**Reference.** Read it when choosing or questioning a tier, not on every build.

## Model policy — tiered by role

**Only a chartered agent can pin `effort`.** The `Agent` tool takes a `model` override but has **no
`effort` parameter** (that was a `Workflow` `agent()` option and did not survive the migration), so a
role dispatched ad-hoc can pin its family and nothing else — its effort inherits the session's. Roles
with a file in `agents/` set both in frontmatter, which is why their tier survives without a caller
re-pasting it every run.

| Agent | `model` | `effort` | Pinned where | Why |
|---|---|---|---|---|
| `outputty-master-qa` | `opus` | `xhigh` | charter | the whole-build gate: roadmap fit + the one real run + the handover, runs once |
| `outputty-docs` | `sonnet` | `high` | charter | judging which prose has no reader is a real call; the writing itself is not |
| `outputty-scout` | `sonnet` | `medium` | charter | finding and reading is not judging — but telling a live path from a dead one is, so not Haiku |

Inherited effort is acceptable for preflight and commit — they are mechanical. Reviewing roles pin
their own tier in their charters.

**No Haiku for code or review** — it drifts on real code (measured 2026-08-06 on a live build: 4 type-machinery tasks × 2 attempts each, 0 successes; re-try a code task on a current Haiku before relying on this). **No Opus rebuild** — Opus *reviews* at master QA, it never redoes stuck work.
There is no posture ladder and no model step-up: QA patches on its own findings at the tier it already
runs at.
`model` is family-only (`haiku`/`sonnet`/`opus`/`fable`) or a full ID.

Frontmatter `effort` is documented and verified: *"Effort level when this subagent is active. Overrides
the session effort level. Default: inherits from session. Options: `low`, `medium`, `high`, `xhigh`,
`max`."* In the 2.1.220 loader it is parsed and validated exactly like `model` and applied at spawn as a
permission layer — the same layer the effort resolver reads — so a typo fails loudly (`Plugin agent
file … has invalid effort`) rather than silently inheriting.

**One thing outranks every charter: `CLAUDE_CODE_EFFORT_LEVEL`.** *"The environment variable takes
precedence over all other methods… Frontmatter effort applies when that skill or subagent is active,
overriding the session level but not the environment variable."* If that variable is set, every tier in
the table above collapses to it — QA included. Check it before blaming a build's quality on the tiers.
