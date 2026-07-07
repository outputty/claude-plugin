# Trail — 0008-beads-lite

> Scoping trail for adding a native **beads-lite** task-graph substrate to outputty's PLAN/BUILD:
> a per-branch JSONL task file + a tiny `tasks.mjs` engine that derives LAYERS from a dependency
> graph, replacing hand-authored layers. **Adopt the beads _model_, not the beads tool.**

## Thought-trail

- **Goal: make task breakdown + progress a queryable dependency graph, staying maximally hands-off.**
  Research (2 workflow sweeps): every beads adopter values exactly one thing — `bd ready`
  (dependency-graph → unblocked set). The rest (daemon, Dolt, memory, UI) is unused surface +
  instability; two experienced users ditched the tool and kept only the graph.
- **Decision: adopt the model natively, not the `bd` binary.** The mechanic is stdlib-tier
  (topological layering), outputty already hand-computes layers, and a hard dep on an alpha,
  240k-LOC, vibe-coded tool with a memory subsystem that fights OpenWolf violates "minimum surfaces"
  + ponytail. Dropped: (A) adopt `bd` the tool; (C) keep hand-authored markdown layers.
- **Memory firewall.** beads' `remember`/`prime` overlaps OpenWolf (cerebrum/buglog) + product.md.
  Not adopted at all — operational memory stays OpenWolf's, decisions stay product.md's.
- **No GitHub issues.** Research killed them for this flow: token cost, webhook/CI noise, "assignment
  primitive, not a checkpoint primitive." The PR stays the human surface; the JSONL is the tracker.
- **Trail keeps only the spec thought-trail.** Task breakdown + progress move OUT of the trail's prose
  `## Plan` into `.tasks.jsonl`. (Was: layers authored as prose in the trail.)
- **Review model: hands-off default, review as a post-build crank.** Per-task two-stage QA still runs
  inside BUILD (the AI pre-review). The human reviews the finished PR whenever they like; their
  comments become `discovered-from` tasks and the same build loop drains them. Dropped: per-layer
  human gating — user optimizes for hands-off over the big-bang-review trade-off (acknowledged).
- **Engine shape (post `ponytail-review`):** `tasks.mjs` — `ready | schedule | add | close`,
  single-writer whole-file rewrite over `.claude/trails/<branch>.tasks.jsonl`. Cut `claim`/`in_progress`
  (no concurrent claimant under single-writer) and `list` (no caller). `schedule` folds in build.md's
  manual non-overlap check: a same-layer scope clash = a missing dep → fail loud.

## Plan

_(populated in PLAN phase)_
