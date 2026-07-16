# PLAN phase — architecture into a task graph, gated

Goal: a dependency-ordered build plan the BUILD phase can execute hands-off.

## Produce

1. **Architecture delta.** What in `product.md`'s Architecture changes or is added. Keep it lazy
   — reuse before build, no speculative structure. **Derive interfaces from product.md's Protocols
   section** — the stable seams between layers were agreed at SPEC; a task `contract` implements a seam,
   it never silently invents a new one (a genuinely new seam is a Protocols edit, surfaced at the gate).
   Protocols follow the parent/child rule: a child exposes inputs → outputs and knows nothing about who
   calls it; the parent composes children.

   **Fork in the road? Simulate, don't guess.** If the delta admits **2+ genuinely distinct designs**
   and neither the Protocols nor the laziest-diff ladder settles it, run the SIMULATE step **before
   writing the task graph** — `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/simulate.md` and follow it:
   propose 2–4 permutations, **the user selects which to run** (a hard gate), one `outputty-simulator`
   per selection runs in a dynamic workflow toward the **same end state** (the target program), and
   every simulation is summarized and compared before one seeds the graph.
2. **Task graph.** Write the tasks to `.claude/trails/<branch>.tasks.jsonl` — one JSON object per line
   (schema + engine: `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.md`). Each task: `id`, `title`,
   a concrete done-condition in `brief` — **keep it a few checkable lines** (checkable, not "improve X";
   a bloated brief is re-embedded across the executor + QA and just burns tokens), `scope` (files/paths),
   `deps` (ids that must finish first). **Derive `scope` from the blast radius, not from intuition:**
   before writing it, locate the definitions of every symbol the brief/contract names (`grep`) and
   include **each file that must change** — including `package.json`/lockfile whenever the brief
   mandates a dependency, and the second file a compile-time gate forces. **A scope narrower than its
   own done-condition forces the executor into silent violation** (verified live: two tasks had scopes
   their done-conditions couldn't fit; a third executor, cornered, silently substituted a redundant
   deliverable). For **non-trivial logic**, also author a `contract` — the
   input/output interface plus **one worked input→output example** the executor turns into its first
   failing test (this is what makes PLAN hand down an interface rather than let the executor invent one;
   omit it for trivial/mechanical tasks). **Same token rule as the brief:** signature-level shapes and
   one example, a few lines — it's re-embedded across the script, executor, and QA exactly like the brief. Optionally add `lenses` (extra review lenses `a11y`/`security`/
   `data-integrity` the QA agent applies); omit for ordinary tasks. **Author dependencies, not layer
   numbers** — layers are derived. Granularity: small enough for one subagent to hold from a
   self-contained brief. **No per-task model knob** — Sonnet is BUILD's floor for every task (no Haiku,
   anywhere; a live run found it drifted, burning attempts without producing usable code), so there is
   nothing to pin. Escalation stays failure-driven: try 1 implement → try 2 patch → try 3 complete
   rewrite (all Sonnet, posture escalates not model) → try 4 Opus layer step-back; QA is always Sonnet.

**Don't rule an approach out from caution — test it.** Before the architecture delta rejects an approach
("that won't work"), reproduce it: the specific case **and** a stripped-down generalised repro (business
logic removed, language/runtime basics only); a split result — one works, the other doesn't — localises
the cause. Explain any "won't work" in the grill's **four-part failure shape** (plain summary → concrete
example → generalised stripped-down → technical). Over-caution that rejects a workable approach costs the
plan more than a cheap experiment would.

**The last layer makes the target program run.** product.md's "What we're building towards" example is
the build's executable acceptance: the final task's done-condition includes *that program (or the slice
this feature covers) runs and produces its stated output* — master QA re-runs it after the graph drains.

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

Present it in the grill's **three-part shape** — plain summary → topmost code example → grounded
technical (see [`outputty-grill`](../outputty-grill/SKILL.md)) — not a wall of prose: a one-line
plain-language summary of what the plan builds, then **each task's `contract`** as the code example (its
input/output shape + example *is* the topmost call — surface it, don't re-narrate it in prose), then the
layer/dependency detail only as deep as the decision needs. The `contract` is agreed here, before BUILD
runs unattended against it. Wait for an explicit OK. If they change scope or a contract, edit the JSONL
and re-preview. This is the last gate.
