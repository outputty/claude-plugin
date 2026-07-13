# PLAN phase — architecture into a task graph, gated

Goal: a dependency-ordered build plan the BUILD phase can execute hands-off.

## Produce

1. **Architecture delta.** What in `product.md`'s Architecture changes or is added. Keep it lazy
   — reuse before build, no speculative structure.
2. **Task graph.** Write the tasks to `.claude/trails/<branch>.tasks.jsonl` — one JSON object per line
   (schema + engine: `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.md`). Each task: `id`, `title`,
   a concrete done-condition in `brief` — **keep it a few checkable lines** (checkable, not "improve X";
   a bloated brief is re-embedded across the executor + QA and just burns tokens), `scope` (files/paths),
   `deps` (ids that must finish first). For **non-trivial logic**, also author a `contract` — the
   input/output interface plus **one worked input→output example** the executor turns into its first
   failing test (this is what makes PLAN hand down an interface rather than let the executor invent one;
   omit it for trivial/mechanical tasks). **Same token rule as the brief:** signature-level shapes and
   one example, a few lines — it's re-embedded across the script, executor, and QA exactly like the brief. Optionally add `lenses` (extra review lenses `a11y`/`security`/
   `data-integrity` the QA agent applies); omit for ordinary tasks. **Author dependencies, not layer
   numbers** — layers are derived. Granularity: small enough for one subagent to hold from a
   self-contained brief. (There is no per-task model knob — BUILD always writes code on Haiku and runs
   QA on Sonnet, complexity notwithstanding.)

Layers are not hand-authored. `tasks.js schedule` derives them from the dependency graph and fails
loud on a cycle or a same-layer scope clash (two ready tasks touching one file = a missing dep).

### Maturity staging (optional — large or uncertain deliverables only)

A big or unfamiliar deliverable reads more clearly when its build **matures in visible stages** rather
than landing in one commit. When it earns it, express that as a `deps` chain over the **same scope**,
tagging each task with a `stage` (the prototype → build → sweep roles):

- **prototype** — the thinnest end-to-end slice that runs, plus the examples/trade-off note that show
  the shape. (Divergent option-exploration belongs in **SPEC**, where it's cheap talk, not throwaway
  code — BUILD stages *mature one artifact*, it never builds-to-discard.)
- **build** — harden that slice to the `contract`; drop what didn't survive the prototype.
- **sweep** — align to existing patterns across the touched files, dedupe, delete scaffolding.

The stages land in successive layers because each `deps` on the last, and the per-layer PR comment then
narrates the maturation (Prototype → Build → Sweep). **Default to a single task** — small, well-understood
work does all three in one laziest diff; staging is opt-in, per deliverable, never a blanket pipeline.
**Promote sweep to its own task only when the cleanup is cross-task** (the per-task QA lens already
sweeps within a task; a `sweep` task earns its place by unifying patterns *across* the feature, which
per-task review can't see). `stage` is a **label only** — it changes nothing in the scheduler; ordering
is still the `deps` you author.

## Gate

Preview the derived schedule for the user:
`node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule`

Present those layers and the tasks in each — **including each task's `contract`**, so the interface
(input/output shape + example) is agreed here, before BUILD runs unattended against it. Wait for an
explicit OK. If they change scope or a contract, edit the JSONL and re-preview. This is the last gate.
