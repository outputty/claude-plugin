# Trail — 0013-absorb-ponytail-self-gate

> Absorb the two things outputty actually needed from ponytail (the over-engineering review + the
> laziest-working-diff discipline), drop the hard dependency, and finally wire build-time prevention as
> a registered `outputty-builder` agent with a self-gate — the pattern from BuilderIO's `agent-watchdog`.

## Thought-trail

- **Trigger.** A deep dive into the ponytail plugin (a 9-agent workflow) plus a critic pass found: of
  ponytail's 103 files, outputty used exactly ONE at runtime — `outputty-qa` invokes the `ponytail-review`
  skill — plus a declared dep and ~30 lines of prose. And the "prevent at build time" half ponytail is
  *supposed* to give never reached BUILD: the executor was a bare `agent(EXECUTOR_RULES + brief)` with no
  laziness text, and `session.js` gates `protocol.md` out of subagents, so no persona reaches the executor.
- **Decision: don't replace the review with another skill — inline it.** The user's point: a skill is an
  extra step a subagent can skip or mis-resolve (the critic flagged bare intra-plugin skill-name
  resolution as the one thing that could silently no-op the QA gate). A registered agent's charter is
  always in context. So the over-engineering review (tags `delete/stdlib/native/yagni/shrink`) is inlined
  into `outputty-qa` step 2 and `qa` — no `ponytail-review`, no `outputty-lean` skill.
- **Decision: build-time prevention = a registered `outputty-builder` agent.** The executor was already
  static ("no per-task casting; fixed prefix"), so promoting it to a registered agent is a clean refactor
  that revisits 0006's "no registered executor" call — justified now because the executor carries real
  discipline, not 2 rules. Its charter = boundary rules + the laziest-diff ladder + a **self-gate**.
- **Decision: the self-gate is `agent-watchdog`'s pattern.** Before handoff the builder reconstructs the
  contract (the done-condition is source of truth, not its own summary), inspects evidence not vibes (run
  the test, read the diff), classifies each gap (missing / broken / evidence-weak / scope-drift),
  self-corrects, and re-runs the smallest check — so QA is the independent *second* gate, not the first.
  `outputty-qa` reuses the same contract/evidence/source-of-truth language.
- **Decision: the discipline lives in two contexts, on purpose.** `outputty-builder`'s charter (build
  subagent) and a compact echo in `protocol.md`'s "When you write code" (main session) — `session.js`
  won't share protocol.md with subagents, so each context needs its own copy. One canonical text.
- **Decision: keep attribution.** ponytail (laziness) and BuilderIO's `agent-watchdog` (the gate pattern)
  are credited as **inspiration** in the README's new Credits section — owned in-plugin, not depended on.
- **Deliberately skipped** (per the dep-analysis): ponytail's mode machinery (lite/full/ultra + hooks +
  statusline), `ponytail-audit`/`-debt`/`-help`/`-gain`, the multi-platform adapters, and the benchmarks.

## Outcome

- `agents/outputty-builder.md` — NEW registered executor agent (rules + laziest-diff discipline + self-gate).
- `agents/outputty-qa.md` — inlined the over-engineering review (dropped the `ponytail-review` skill call
  and the `Skill` tool); framed as the independent second gate.
- `skills/outputty/build.md` — executor dispatched via `agentType: 'outputty-builder'`; removed `EXECUTOR_RULES`.
- `skills/qa/SKILL.md` — inlined the review, dropped the ponytail deference.
- `hooks/protocol.md` — added the laziest-diff discipline to "When you write code"; reworded the boundary + flow.
- `skills/outputty/SKILL.md`, `plan.md`, `tasks.md`, `tasks.js`, `tasks.test.js`, `docs/flow.svg` — reworded ponytail references.
- `README.md` — new Credits section (ponytail + `agent-watchdog`); dropped "pulls ponytail automatically".
- `.claude-plugin/marketplace.json` — removed `dependencies` + `allowCrossMarketplaceDependenciesOn`; reworded.
- `.claude/product.md` — reworded live Architecture references + new *What was tried* entry.
- `package.json` + `marketplace.json` — version `0.4.1` → `0.5.0`.
