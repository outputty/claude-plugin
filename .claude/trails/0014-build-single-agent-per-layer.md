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

## Open (grilling)

- Loop cap before escalation? What replaces the 3-try posture ladder + Opus step-back?
- Scope model: per-task scope → layer union scope. Blocked-result handling.
- Is trimming master-QA overlap + the 9m commit agent in scope, or a separate change?
- BUILD-execution right-sizing: dynamic-workflow subagents vs. direct edits for prose-only deliverable.
