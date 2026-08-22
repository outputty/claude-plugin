---
name: planning
description: Runs outputty's gated PLANNING stage on one work item: SPEC then PLAN with the user, ending at spec settled. Triggers on /outputty:planning <id>, or a session told to plan. Not a grilling interview (grill), not an issue body (issue-authoring), not a build (build).
---

# outputty - PLANNING stage

Input: one work item, and the user answering in this session.

Output: four artifacts, all four required.

1. **The target program** - written into `.claude/architecture.md`, replacing its **What we're building
   towards** block.
2. **The trail** - one `decision` entry per settled question, on the item task.
3. **The task graph** - in the `tasks` MCP server, each task carrying its `brief`, `contract`, `scope`,
   `deps` and `target`.
4. **The handoff** - every task at `spec: settled`. No build sweep sees the work until then.

## Your steps

1. **Branch and draft PR.** On an item branch in a worktree, the branch is already cut: push and open a
   draft PR stating the objective. Otherwise cut `feature/<kebab>` off the default branch first, then do
   the same.
2. **SPEC** _(gated)_: the section below. On a `replan`, read the trail's `Attempt -` notes first. Each
   one is a road already closed. A broken workspace is not a replan.
3. **PLAN** _(gated)_: the section below.
4. **Settle the graph.** `edit_task` every task to `spec: settled`, each one carrying its `tier` and its
   `qa` (`skip`, `inline` or `subagent`). Confirm with `get_task`, then stop.

**The gates are yours.** SPEC and PLAN stop for the user, and the user answers them here, in this session.
Never wait for a gate to be relayed.

⚠ Ring the doorbell with `notify` before you go quiet at a gate, naming the gate, the id and the pane.
Nothing polls, so a gate nobody rang stays invisible.

```text
tasks MCP: notify { project, note: "SPEC gate on <id> - pane <name>" }
```

**You do not build.** Run the item to its handoff, then report.

Don't know what to plan? `audit` finds it.

## SPEC - intent, gated

Goal: a shared, precise understanding of what to build and why. Keep business and technical intent
separate.

**Load first.** Re-read `.claude/product.md` (North Star and Language) as the baseline. Then read
`.claude/roadmap.md` and `.claude/architecture.md` whole. Every question runs against both.

**Run the grilling.** `Read ${CLAUDE_PLUGIN_ROOT}/skills/grill/SKILL.md` now, before the first question.
Never work from a summary of it.

SPEC binds that interview to three distinct passes, never conflated. They are this stage's agenda,
whichever grilling mode runs.

1. **Business goals** - who this is for, the outcome, what "done" means, what is explicitly out of scope.
   - Feeds the **North Star**.
2. **Technical goals** - constraints, integration points, data shape, trade-offs, what must not break.
   - Feeds the **Architecture**.
3. **Shape** - what each new piece looks like beside what already exists, its exemplar at `file:line`.
   - Feeds the **target program** and every task's **Sibling** reference.

### The target program - the first concrete artifact

Draft the **What we're building towards** block before architecture is discussed. Write it in the format
that `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` enforces. Then descend into
per-feature detail, each knob with its own worked example.

Then descend once more, to shape. For each new piece, name the existing thing it will sit beside, at
`file:line`, and show that exemplar. You derive each exemplar and give it as a recommendation the user
overrules, never as a question they research.

Agree the program with the user.

⚠ Write the agreed program into `.claude/architecture.md`, replacing the **What we're building towards**
block that is there.

### Spike - the default, not the fallback

A spike is what you do instead of having the argument. **State only design positions you have run.**

How deep to spike follows the change:

1. **A variation on an existing shape, with evidence it works** - spike quickly. One question, minutes,
   enough to confirm the shape holds. No write-up.
2. **A new capability, or a change in direction** - spike heavily, before any proposal. No plan is drafted
   until it answers what the change costs.
3. **A simplification, a deletion, or "can we make this simpler?"** - spike heavily, before any proposal,
   and see the deletion rules below.

**Assumptions need existing evidence.** Point at code that already does it, a measurement, or a doc you
read.

How a spike runs (a deletion is a spike too):

1. **One test file per question**, its name carrying `spike-<slug>`, committed with the repo's tests as
   written. Reuse the slug in the trail and any resulting claim.
2. **Variants are test cases, not separate scripts.** Options A, B and C are cases in the one file, fed
   the canonical example data. A variant that must run inside the app goes on a throwaway branch that
   never merges. Say so when you cut it.
3. **The answer survives; the spike graduates or dies.** Append the decision and what was dropped to the
   trail. Then record the validated fact where its reader works. A graduated spike's test is the
   re-verification probe, so it stays in the suite. Delete a dead-end spike in the same session, as a
   tracked commit. Redraft the target program with what you learned.

A spike's code is never a deliverable. The `contract` and its test carry the answer forward.

A spike can fire mid-grilling: feed the answer back and carry on. Don't confuse it with `stage: prototype`,
which is the first real commit, kept and matured.

**The tests are the specification.** Simplification means the same expected outcome with less machinery.

1. **Keep every test exactly as it is.** Through a simplification, never rewrite a test to fit the new
   shape.
2. **Delete a test only when the feature it covers is being deleted.** That is a product decision: close
   the target in the graph and record the kill in `lessons.md` before the test goes.
3. **Run the deletion test first.** Imagine the thing gone. If the complexity vanishes it was a
   pass-through and it goes. If it reappears across N callers, it was earning its keep.
4. **Price what you remove before you scope its removal.** "Not worth its cost" needs a number.
5. **Delete one thing at a time.** A verdict applies to the unit you measured, never the story it arrived
   in.

### Resolve into the product docs

When a business or technical point crystallises, write it into its doc immediately. Read
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md` for the write-routing rules and
skeletons. Tracked work goes to the `tasks` MCP server via `add_task`, never onto a roadmap row.

Show unshipped behaviour as _expected_, marked, never asserted as shipped.

The agreed destination goes to the draft PR and to the target's brief. The tasks go to the graph (PLAN,
below).

**Fog** is a question you can see but cannot yet phrase sharply. The test is whether you can state the
question precisely now, not answer it. Sharp means it can become a task, even if blocked.

**Task, fog and out of scope are MECE**: every piece of known work is exactly one of the three. Out of
scope is work past that destination. It is a scoping act, not a decision: one line of what and why. Record
it in the target's brief or the task's scope. Never file it as a new target, because a target with no work
under it is a placeholder.

**SPEC gate:** do not proceed to PLAN until the user confirms the spec is right.

## PLAN - architecture into a task graph, gated

Goal: a dependency-ordered build plan that needs no further human input.

### 1. Architecture delta

Read `.claude/roadmap.md` and `.claude/architecture.md` whole, now. The delta is what changes or is
added in `architecture.md`. Keep it lazy: reuse before build, no speculative structure.

**Before any task says "build X", answer: does X already exist?** Name the alternative you rejected, and
why, in the brief.

**Derive interfaces from `architecture.md`'s seams.** The stable seams (protocols) between layers were
agreed at SPEC. A task `contract` implements a seam, never silently invents one. A genuinely new seam is an
Architecture edit, surfaced at the gate. Seams follow the parent and child rule: a child exposes inputs to
outputs and knows nothing about who calls it; the parent composes children.

**Two adapters, or it is not a seam.** Name the two things that will satisfy it before you add one to the
delta. The production one plus a test fake, two backends, or old and new migration paths all count. Cannot
name a second? Inline it.

**Fork in the road? Spike it, don't guess.** Some deltas admit two or more genuinely distinct designs.
When neither the seams nor the reuse ladder settles it, take it back to SPEC. Run a quick spike per
candidate under SPEC's spike rules. The user picks at a hard gate, and the winner seeds the graph.

### 2. Task graph - chart only what you can see

**Task what is sharp, fog what is not** (fog is defined in SPEC). Let the fog graduate as earlier tasks
resolve, and drop each fog patch as it becomes a task. Never pre-slice a fog patch into task-shaped pieces.

Create each task with `add_task` `{ project, id, title, brief, contract, scope: [a **folder**], deps,
tier, qa, spec, target }`.

**No target yet? File one first.** Call `add_target { project, id, title, brief }`, with its paragraph in
`roadmap.md`. Set a target's `deps` when the sequencing is real, never to express a wish.

**Author with `spec: drafting` while the graph is still forming.** Set each task `settled` once its
`contract` holds, via `edit_task`, or with `spec: settled` on create. A `drafting` task never drains to a
build.

**The `brief` and `contract` are the GitHub issue body.** Read
`${CLAUDE_PLUGIN_ROOT}/skills/issue-authoring/SKILL.md` and write both to that spec, whenever you create
or revise a task.

PLAN enforces three gates on what comes back:

1. **A `contract` on every non-trivial task.** Only a trivial or mechanical task is exempt: a rename, a
   constant, a config flip.
2. **A trivial task's `brief` is a checkable condition**, such as grep clean of the old symbol, never
   "improve X". That exemption reaches the `contract` only.
3. **`scope` is one folder, not a file list.** Name the folder the work belongs in. Pick the files inside
   it at build time, with the code in front of you. Two tasks sharing a folder is normal.

**Documentation lands in the stack's last layer.** A documentation-scope task takes a `deps` on every code
task it describes. The schedule derives it into the final layer, where the layer-size floor does not
apply. That covers a README, `docs/`, and a product-memory rewrite. Instruction files that _are_ the flow's
behaviour (`skills/`, `agents/`) are code here, not documentation.

**Two anti-drift lines when they apply.** Skip both for a trivial task.

1. **A do-not-touch list** - files inside the folder that look related but are out of scope, each with a
   one-line reason.
2. **Task-specific stop conditions** - when to stop and report: an assumption proved false, a file needed
   outside the folder, or verification failing twice.

**Author dependencies, not layer numbers.** The `schedule` tool derives the layers from your `deps`. The
layer is BUILD's unit of work: one builder builds all of its tasks, one QA reviews them together.
Parallelism comes from splitting work across layers with `deps`, never from many tasks in one layer. A
layer is also a pull request, so size it for a reviewer, between a floor and a ceiling:

1. **Under ~100 added lines** - too small. Merge it into its neighbour.
2. **500 to 700** - the target. One sitting, one decision.
3. **Over 1000** - too big. Split it.

Estimate at the gate from each task's scope, catching the layer that is obviously 2,000 lines or
obviously 40. **Merge a layer into its neighbour unless it is independently reviewable**, meaning a change
someone could accept or reject on its own terms. Split by _decision_, never by _file_ or _step_: real
dependencies force a split, tidiness does not, and a genuinely large indivisible change ships whole.

**The last layer makes the target program run.** Its tasks produce the stated output of the program in
`.claude/architecture.md`.

**Stamp the base.** Record the commit the graph was planned against, from `git rev-parse --short HEAD`, as a
`Planned-at:` `append_trail` note on the task.

**Reproduce before you reject.** Before the architecture delta rules an approach out, reproduce it.
Explain any "won't work" in the grill's four-part failure shape.

### Maturity staging - optional, large or uncertain deliverables only

A big or unfamiliar deliverable can mature in visible stages instead of one commit. Express it as a
`deps` chain over the same scope, each task tagged with a `stage`:

- **prototype** is the thinnest end-to-end slice that runs, plus the examples and trade-off note that show
  the shape. Divergent option-exploration belongs in SPEC, as cheap talk or a discarded spike.
- **build** hardens that slice to the `contract`, and drops what did not survive the prototype.
- **sweep** aligns to existing patterns across the touched files, dedupes, and deletes scaffolding.

Stages land in successive layers because each one `deps` on the last. **Default to a single task**;
staging is opt-in, per deliverable, never a blanket pipeline. Promote sweep to its own task only when the
cleanup is cross-layer. A `stage` is a label only: ordering is still the `deps` you author.

### Anchors

**Every structural assertion the graph rests on has an anchor.** Classify each one before its task is
filed.

1. **An assertion about this repo** - anchored in the code and `architecture.md`, verified by reading or
   running it now.
2. **An assertion about an external dependency** - anchored in a `kind: limitation` architecture entry or
   a CLAUDE.md rule, carrying its re-verification probe.
3. **Neither** - it is an assumption, not an anchor. Validate it now with a spike recorded where its
   reader works, or fog it.

**PLAN gate:** preview the derived schedule for the user by calling the `tasks` MCP tool `schedule`
`{ project }`.

Present it, not a wall of prose. Give a one-line summary of what the plan builds. Surface each task's
`contract` as the worked example. Then add only the layer and dependency detail the decision needs. The
`contract` is agreed here. Wait for an explicit OK. If they change scope or a contract, `edit_task` the
affected task, or reshape the graph with `add_task` and `close_task`, then re-preview. This is the last
gate.
