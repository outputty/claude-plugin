# PLAN phase — architecture into a task graph, gated

Goal: a dependency-ordered build plan the BUILD phase can execute hands-off.

## Produce

1. **Architecture delta.** What in `product.md`'s Architecture changes or is added. Keep it lazy
   — reuse before build, no speculative structure.
2. **Task graph.** Write the tasks to `.claude/trails/<branch>.tasks.jsonl` — one JSON object per line
   (schema + engine: `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.md`). Each task: `id`, `title`,
   a concrete done-condition in `brief` — **keep it a few checkable lines** (checkable, not "improve X";
   a bloated brief is re-embedded across the executor + QA and just burns tokens), `scope` (files/paths),
   `deps` (ids that must finish first), and optionally `lenses` (extra review lenses `a11y`/`security`/
   `data-integrity` the QA agent applies) and `complex: true` (run the executor on Sonnet, not the
   default Haiku). Omit both for ordinary tasks. **Author dependencies, not layer numbers** — layers are
   derived. Granularity: small enough for one subagent to hold from a self-contained brief.

Layers are not hand-authored. `tasks.js schedule` derives them from the dependency graph and fails
loud on a cycle or a same-layer scope clash (two ready tasks touching one file = a missing dep).

## Gate

Preview the derived schedule for the user:
`node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule`

Present those layers and the tasks in each. Wait for an explicit OK. If they change scope, edit the
JSONL and re-preview. This is the last gate — after it, BUILD runs unattended.
