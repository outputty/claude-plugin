# Trail — 0003-init-scan-depth

> Scoping trail for making outputty-init's scan depth user-selectable, with the expensive
> commit+diff scan gated behind an explicit checkbox.

## Thought-trail

- **init should let the user set scan depth.** → Step 2 now drives the **AskUserQuestion** tool
  (multi-select). Cheap sources (docs, docstrings) default on; the user confirms the set before any
  scanning runs.
- **Deep commit+diff scan is expensive → gate it behind a checkbox.** → New opt-in option
  "Deep commit + diff scan" (default OFF). Reading diffs/reverts recovers the historical pivots that
  commit messages rarely state — addresses the reverse-audit's scanner-genericization finding for
  history-heavy repos, without paying the cost by default. Dropped: reading diffs by default (kept
  messages-only as the cheap default).
- **scanner.md is now conditional.** Messages/tags/merges by default; diffs/reverts only when the
  subagent is dispatched with "deep".
- **Still pending (from the reverse-audit, not in this change):** STATED-vs-INFERRED output tagging,
  per-source size/sampling caps, and an explicit dedup/aggregation step.
