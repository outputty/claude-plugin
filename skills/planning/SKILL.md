---
name: planning
description: outputty PLANNING stage — SPEC then PLAN a work item with the user in the loop, ending when the task reads spec settled. The orchestrator dispatches this as a child session's first prompt (/outputty:planning <id>); a session told to plan invokes it before anything else. Assumes the CLAUDE.md outputty block is already in context.
---

# outputty — PLANNING stage

**You are a PLANNING session.** Your job ends when this item's task reads `spec: settled`. Nothing
else counts as finishing it, and no build sweep can see the work until it does.

## Your steps

1. **Branch + draft PR.** On an item branch in a worktree, the branch was cut for you. Push and open a
   **draft PR** stating the objective. Otherwise cut `feature/<kebab>` off the default branch first,
   then do the same.
2. **SPEC** _(gated)_ - the section below. On a `replan`, read the task's `attempts` FIRST: each entry
   is a road already closed.
3. **PLAN** _(gated)_ - the section below.
4. **Settle the task.** Set `spec: settled` and stop — the handoff. Each task's `tier` and `qa`
   (`skip`/`inline`/`subagent`) are authored in the graph above.

**The gates are yours.** SPEC and PLAN stop for the user, and **the user answers them here, in this
session**. Under Herdr an orchestrator raises a notification naming this workspace, then stays out of
it. Never wait for a gate to be relayed to you.

**You do not build.** Settling the task is the deliverable.

**Don't know what to plan?** `audit` finds it. Target-level picks feed `roadmap.yaml`, and task-shaped
picks are filed with the `tasks` MCP tool `add_task`.

**Under Herdr you never close your own workspace or dispatch a sibling session.** You run this item to
its handoff and report. The orchestrator closes the workspace afterwards.

## SPEC - intent, gated

Goal: a shared, precise understanding of **what** to build and **why**. Business and technical intent
stay separate. Output lands in the trail, and then in the product docs.

**Load first.** Re-read `.claude/product.yaml` (North Star + Language) as the baseline. Then read
`.claude/roadmap.yaml` and `.claude/architecture.yaml` whole. Every question runs against both.

**Run the grilling.** `Read ${CLAUDE_PLUGIN_ROOT}/skills/grill/SKILL.md` now, before the first question.
Never work from a summary of that skill.

Interview relentlessly **in rounds**: the whole answerable frontier at once, numbered, each with a
recommended answer. Backtrack and surface conflicts. Run the assumption ledger against what exists, what
does not, and `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" lessons --json`. Explore the codebase
instead of asking whenever the answer is discoverable. Use LSP symbol lookup where the language has a
server, and `Grep`/`Glob` otherwise.

**Simple grilling is the default.** For a non-trivial plan, offer the user **advanced** grilling after
grounding. Raise it as an `AskUserQuestion`, with the cost named. Advanced mode adds a Why to What to How
agenda, plus an expert and adversary panel fanned out as parallel subagents.

Ask in **two distinct passes**, and never conflate them.

| Pass                 | Ask about                                                                       | Feeds                |
| -------------------- | ------------------------------------------------------------------------------- | -------------------- |
| **Business goals**   | who this is for, the outcome, what "done" means, what is explicitly out of scope | the **North Star**   |
| **Technical goals**  | constraints, integration points, data shape, trade-offs, what must not break     | the **Architecture** |

### The target program - the first concrete artifact

Draft the **"What we're building towards"** block before architecture is discussed. It is a concrete,
runnable example of how the final implementation looks to the user or agent. Write the exact code they
will write, source to transform to destination for pipeline work. Give **Input** and **Output** as
distinct valid-JSON blocks. Then descend into per-feature detail, each knob with example JSON I/O.

The North Star informs it, and it is not the North Star. Agree it with the user. It becomes the build's
executable acceptance: PLAN pins the last layer to it, and master QA runs it. Every PR write
**snapshots** it, annotated implemented or pending per layer, with real outputs. The format is in
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`.

### Spike - the default, not the fallback

A spike is what you do **instead of having the argument**.

**State only design positions you have run.**

| The change is…                                                     | Spike                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **a variation on an existing shape**, with evidence it works        | **Quick.** One question, minutes, enough to confirm the shape holds. No write-up.      |
| **new capability, or a change in direction**                        | **Heavily, before any proposal.** No plan is drafted until it answers what it costs.   |
| **a simplification, a deletion, or "can we make this simpler?"**    | **Heavily, before any proposal**, and see the deletion rules below.                   |

**Assumptions need existing evidence.** Point at code that already does it, at a measurement, or at a
doc you read.

**How a spike runs, and the deletion rules** (a deletion is a spike too), are one-point-in-flow detail:
read `${CLAUDE_PLUGIN_ROOT}/skills/planning/references/spike.md` when you actually run one.
### Log the thought-trail, before the next question, every time

**The trail is the item task's comment thread** in the `tasks` MCP server. Append one entry per settled
question with `append_trail` (`kind: decision`); read the thread back with `get_trail`. The
**destination** goes to the draft PR and the roadmap row; the **tasks** go to the MCP graph (the PLAN
section below).

Each decision entry carries the **question**, the **answer** (in prose), and **what was dropped** — the
alternatives you considered and set aside. Point at where the detail is filed, e.g. `product.yaml
north_star` or a `file:line`.

**Task, fog and out-of-scope are MECE**: every piece of known work is exactly one of the three.

- **Fog** is a question you can _see_ but cannot yet phrase sharply. **The test is whether you can state
  the question precisely now, not whether you can answer it now.** Sharp means it can become a task, even
  if blocked. Fog is transient: hold it in the session, and never pre-slice it into task-shaped pieces.
- **Out of scope** is work past the destination. It is a **scoping act, not a decision**: one line of
  what and why. Record it on the roadmap row or the task's scope; it never graduates.

**Record the decision for the answered question BEFORE asking the next one. No exceptions.** The answer
names what was branched or dropped, which is the alternatives you considered and set aside. Keep it
terse, one line per node.

### Resolve into the product docs

When a business or technical point crystallises, write it into its doc immediately. **Each decision has
exactly one home.** The block's product-memory table names each set. The full write-routing rules and
skeletons are in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`, so read it.
Tracked work goes to the `tasks` MCP server via `add_task`, never onto a roadmap row.

**Verify before you write.** Any claim about **already-shipped** behaviour must be **run in the codebase
first**, with real output and no guessing. That covers a ✅ feature and an existing API or flag. Target
behaviour (🔨/📋) is shown as _expected_, marked, and never asserted as shipped.

The three living docs are **pruned, never append-only**. Delete what a new decision makes stale. A real
pivot worth remembering moves to `lessons.yaml`, the one archive. There is no separate `CONTEXT.md` and
there are no ADRs.

**SPEC gate:** do not proceed to PLAN until the user confirms the spec is right.

## PLAN - architecture into a task graph, gated

Goal: a dependency-ordered build plan the BUILD stage can execute hands-off.

### 1. Architecture delta

Read `.claude/roadmap.yaml` and `.claude/architecture.yaml` whole, now. The delta is what changes or is
added in `architecture.yaml`. Keep it lazy: reuse before build, and no speculative structure.

**Before any task says "build X", answer: does X already exist?** Look in this repo, in an installed
dependency, and in the well-known libraries. Name the alternative you rejected, and why, in the brief.

**Derive interfaces from `architecture.yaml`'s seams.** The stable seams (protocols) between layers were
agreed at SPEC. A task `contract` implements a seam, and never silently invents a new one. A genuinely
new seam is an Architecture edit, surfaced at the gate. Seams follow the parent/child rule: a child
exposes inputs to outputs and knows nothing about who calls it, and the parent composes children.

**Two adapters, or it is not a seam.** Name the **two** things that will satisfy it before you add one
to the delta. The production one plus the fake the tests drive counts. Two backends count. The old path
and the new one during a migration count. **Cannot name a second? Inline it.**

**Fork in the road? Spike it, don't guess.** Some deltas admit **2+ genuinely distinct designs**. When
neither the seams nor the laziest-diff ladder settles it, take it back to SPEC. Run a quick spike per
candidate under SPEC's spike rules, **the user picks** at a hard gate, and the winner seeds the graph.

### 2. Task graph - chart only what you can see

**Task what is sharp, fog what is not** (fog is defined in SPEC above). Let the fog graduate as earlier
tasks resolve, and drop each fog patch as it becomes a task.

Create each task with the `tasks` MCP tool `add_task` `{ project, id, title, brief, contract, scope: [a
**folder**], deps, tier, qa, spec }`. The task graph and each task's trail live in the `tasks` MCP
server, synced to GitHub Issues.

**Author with `spec: drafting` while the graph is still forming.** Set each task `settled` once its
`contract` holds — via `amend_task`, or pass `spec: settled` on create. A `drafting` task never drains
to a build.

**A brief is the PR description, written forward.** Describe the **end state** the way you would describe
it to a reviewer after it shipped, and stop. The builder decides how to get there.

| The brief says | The brief does not say |
| --- | --- |
| **What we're building towards** - the end state, and the slice of architecture.yaml's target program it makes real | Which functions to write, or what to name them |
| **Architecture** - a **Mermaid** diagram of the shape: the new pieces, the seams, what flows where (agents read text, not pictures) | Step-by-step implementation notes |
| **Input → output** - the `contract`, with **at least one worked example** | Which files to change |
| **Where** - one folder | A blast-radius file list |
| **Repeat work?** - say so, and point at `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" lessons --files <path>` | An approach you'd have taken |

**Documentation lands in the stack's LAST layer.** A task whose scope is documentation takes a `deps` on
every code task it describes, so the schedule derives it into the final layer. That covers a README,
`docs/`, and a product-memory rewrite. The layer-size floor does not apply to it. Instruction files that
_are_ the flow's behaviour (`skills/`, `agents/`, `hooks/`) are code here, not documentation.

**`scope` is a folder, not a file list.** Name the folder the work belongs in. Pick the files inside it
at build time, with the code in front of you. Two tasks sharing a folder is normal.

**A `contract` is REQUIRED for every non-trivial task.** It is the input/output interface plus **one
worked input→output example**, built on the canonical data in `docs.js examples --name "<name>"`. Pin a
new shape in `examples.yaml` first when none fits. **That example is the definition of done.** The
builder turns it into a failing test and codes until green. QA checks that the test encodes it. Only a
**trivial or mechanical** task is exempt, such as a rename, a constant or a config flip. Then the `brief`
alone must be a concrete checkable condition, such as grep clean of the old symbol, and never "improve
X". Optionally add `lenses`, the extra review lenses master QA applies, and omit them for ordinary tasks.

**Two anti-drift lines when they apply.** A **do-NOT-touch list** names files inside the folder that look
related but are out of scope, each with a one-line reason. Task-specific **STOP conditions** name when to
stop and report: an assumption proved false, a file needed outside the folder, or verification failing
twice. Skip both for a trivial task.

**Keep it short.** Say the end state, show the shape, give the example, name the folder. Anything past
that is you designing.

**Author dependencies, not layer numbers.** Layers are derived, and **the layer is BUILD's unit of
work**: one builder builds all of a layer's tasks, and one QA reviews them together. Parallelism comes
from splitting work across layers with `deps`, never from many tasks in one layer. Keep each task small
and coherent, and a layer's tasks together small enough for one builder to hold. **A layer is also a pull
request, so size it for a reviewer.** There is a floor and a ceiling.

| Additions in a layer | Verdict |
| --- | --- |
| < ~100 | **too small** - merge it into its neighbour |
| **500-700** | **the target** - one sitting, one decision |
| > 1000 | **too big - split it.** |

Estimate at the gate from each task's scope. Catch the layer that is obviously 2,000 lines or obviously
40. **Merge a layer into its neighbour unless it is independently reviewable**, which means a change
someone could accept or reject on its own terms. Split by _decision_, never by _file_ and never by
_step_. Real dependencies still force the split, and tidiness does not. A genuinely large, indivisible
change ships whole. **There is no per-task model knob.** Escalation is failure-driven: a fix that fails
twice after a real diagnosis escalates the layer to the user.

**Stamp the base.** Record the commit the graph was planned against, from `git rev-parse --short HEAD`,
as a `Planned-at:` `append_trail` note on the task. BUILD's preflight reads it to catch **drift**.

**Reproduce before you reject.** Before the architecture delta rules an approach out, reproduce it. Run
the specific case **and** a stripped-down generalised repro (business logic removed, language or runtime
basics only). Explain any "won't work" in the grill's **four-part failure shape**: plain summary,
concrete example, generalised stripped-down, technical.

**The last layer makes the target program run.** The output of
`docs.js architecture --section target_program` is the build's executable acceptance. The final layer's
tasks make that program run and produce its stated output, and master QA runs it once after the graph
drains.

Layers are not hand-authored. The `tasks` MCP tool `schedule` derives them from the dependency graph,
and fails loud on a cycle.

### Maturity staging - optional

A big or uncertain deliverable can **mature in visible stages** (`prototype -> build -> sweep`) over one
scope. Each stage is a `deps` step. Default to a single task; when you need staging, read
`${CLAUDE_PLUGIN_ROOT}/skills/planning/references/maturity-staging.md`.

### Anchors

**Every structural assertion the graph rests on has an anchor.** An assertion about this repo is
anchored in the code and `architecture.yaml`, verified by reading or running it now. One about an
external dependency is anchored in a `kind: limitation` architecture entry or a CLAUDE.md rule, carrying
its re-verification probe. An assertion with neither is an assumption: validate it now with a spike
recorded where its reader works, or fog it. Name the cited entries in the task's brief where they bear
on it.

**PLAN gate:** preview the derived schedule for the user by calling the `tasks` MCP tool `schedule`
`{ project }`.

Present it in the output style's response shape, not as a wall of prose. Give a one-line summary of what
the plan builds. Surface **each task's `contract`** as the worked example. Then add only the layer and
dependency detail the decision needs. The `contract` is agreed here. Wait for an explicit OK. If they
change scope or a contract, `amend_task` the affected task (or `add_task`/`close_task` to reshape) and
re-preview. This is the last gate.
