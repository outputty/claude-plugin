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
  manual non-overlap check: a same-layer scope clash = a missing dep → fail loud. Pure `schedule`/`ready`
  exported + a `tasks.test.mjs` assert self-check (layering, done-unblock, cycle, scope-clash).

- **BUILD is one Workflow-tool call, not subagent dispatch.** Symptom: BUILD ran as "a list of
  subagents, not a workflow view." Root cause: build.md described a workflow but its framing (plus a
  legacy dispatch model in the cached plugin) led the model to fan out Agent calls. Fix: build.md now
  states BUILD = one Workflow-tool invocation (a real dynamic workflow), **forbids** the
  Agent-dispatch fallback, reads layers from `tasks.mjs schedule`, and adds a drain loop. Dropped:
  hand-emulating the workflow via subagents.

- **OpenWolf via CLI, never hand-edited (subtractive).** Symptom: outputty was instructing manual
  `.wolf/` edits. Finding (read the CLI source, `dist/src/cli/index.js`): OpenWolf exposes **no** write
  command for cerebrum/buglog/memory — only `scan` (anatomy), `bug search` (read), `status`. So the fix
  is subtractive: delete outputty's manual `.wolf/`-edit instructions, use `openwolf scan` for the map
  and `openwolf bug search` before a fix, and leave the rest to OpenWolf's own hooks. Reading
  anatomy/cerebrum for context stays fine. `.wolf/OPENWOLF.md` + `.claude/rules/openwolf.md` are
  OpenWolf's own turf — left untouched.

## Change set (implemented directly by the orchestrator, not via BUILD)

- **New:** `skills/outputty/tasks.mjs` (engine), `tasks.test.mjs` (self-check), `tasks.md` (reference).
- **Edited:** `plan.md` (emit + preview the graph), `build.md` (Workflow-tool framing + `schedule`/drain
  + OpenWolf subtractive), `SKILL.md` (vocab + OpenWolf/correction-routing rules), `product.md`
  (Flow/memory-boundary/Language + What-was-tried 0008), `.claude-plugin/marketplace.json` (0.1.2 → 0.2.0).
- **Unchanged (already correct):** `hooks/session.js` (already dynamic-workflow language); no
  `task-runner` agent exists (dropped in 0006).
