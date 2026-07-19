# 0014 — BUILD: one builder + one QA per layer, loop until done

**Anchor (North Star tie):** BUILD is meant to run hands-off and *cheap*. Real runs are 57m+ with
questionable value — the cost is per-task fan-out: N builder agents (each cold-booting ~200k tokens) +
N QA agents (each re-running the whole `CHECKS` suite), plus the retry ladder and a 9m commit agent.
This change collapses per-task fan-out to **one builder + one QA per layer**, matching the two
consolidations BUILD already made (3 QA reviewers → 1; per-task commit → 1/layer).

## Locked (user, this session)

- **Q: builder/QA granularity?** → **One builder + one QA per layer.** Not the hybrid (parallel
  builders, one QA). Dropped: per-task fan-out; intra-layer parallelism. Parallelism relocates to the
  **dependency graph** — PLAN splits genuinely-wide/heavy work across layers, not within one.
- **Q: retry model?** → **Loop until done** (one warm builder ↔ one QA over the whole layer). Details
  (cap, escalation) = open, grilling below.
- **Q: how to carry out?** → run the outputty flow.

## Locked (grilling)

- **Q1: loop cap / escalation ladder?** → **Warm Sonnet loop, cap K=3, then escalate to user** (today's
  4-part shape). **Opus step-back DROPPED** — a plan that won't converge in 3 rounds is a *human's* call
  at the gate, not an Opus agent's guess. Dropped: the per-task `implement/patch/rewrite` posture ladder
  and the fresh-cold-rewrite rung (one warm builder patching on findings covers iteration).
- **Q2: root cause = vague definition-of-done → TDD.** User: agents get stuck because the DoD is vague.
  Fix — **the failing test IS the definition of done.** Roles:
  - **Builder** → write the failing test first, code until it's green. Done = test green (objective, binary).
  - **QA** (per layer) → look at the *code that made the test pass*: docs present, implemented per spec,
    architecture matches established patterns. (Quality/conformance, not re-deriving a prose DoD.)
  - **Master QA** → everything across all layers matches `product.md`.

- **Q3: anti-test-theatre guard** → **QA's first duty = every test created matches specs +
  documentation** (real, discriminating, encodes the PLAN `contract`), *then* code quality. The
  contract's worked example is PLAN-authored so the builder can't weaken the bar.
- **Q4: `contract` REQUIRED for every non-trivial task at PLAN** → **yes.** A task cannot ship with a
  vague DoD; trivial work (rename/const/config/docs) is the only exemption.

## Decided by Claude (recommendations — object if wrong)

- **Carve-out:** non-testable work falls back to a concrete checkable condition; TDD is the default, not
  an absolute (this very change edits markdown — no unit test).
- **QA gets its patterns by reading `.claude/product.md`'s Architecture** directly (it has Read; product.md
  isn't injected into subagents). "Matches established patterns" = matches product.md's Architecture +
  the dependency-direction rule.
- **Scope model:** per-task scope → the layer's **union scope**. `blocked` still escalates immediately
  (scope/API wall — no rungs burned).
- **Master QA:** stays, role reaffirmed — whole-build conformance to product.md + run the target program.

- **Q5: commit-agent trim** → **IN this change.** The 9m30s is the commit agent (a) running the program
  per layer for real snapshot JSON and (b) sometimes drawing+committing an SVG. Trim: commit agent
  **stops running the program** (per-layer snapshot → **marked-expected** JSON) and **stops drawing
  diagrams** (final PR body only); commit + push + close stay mechanical; per-layer narrative stays but
  terse. The program's ONE real run stays at master QA; the final PR body reuses it (already the rule).
  **Softens PR #30's per-layer real-output** → real JSON now lands once, at the final body. Touches
  `references/pr-description.md`'s per-layer rules.

## Open

- BUILD-execution right-sizing (prose deliverable) — decide at PLAN→BUILD gate.
