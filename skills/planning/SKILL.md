---
name: planning
description: Runs outputty's gated PLANNING stage on one work item: SPEC then PLAN with the user, ending at spec settled. Triggers on /outputty:planning <id>, or a session told to plan. Not a grilling interview (grill), not an issue body (issue-authoring), not a build (build).
---

# outputty - PLANNING stage

**Optional, and human-run.** A ticket that already clears the dispatchable bar is dispatched as it
stands. This stage is for the item too big or too contested to author directly, and what it produces
is tickets that clear that bar.

Input: one work item, and the user answering in this session.

Output: four artifacts, all four required.

1. **The target program** - written into `.claude/architecture.md`, replacing its **What we're building
   towards** block.
2. **The trail** - one `decision` entry per settled question, on the item task.
3. **The task graph** - in the `tasks` MCP server, each task carrying its `brief`, `contract`, `scope`,
   `deps` and `target`.
4. **The handoff** - every task at `spec: settled`. No build sweep sees the work until then.

## Your steps

1. **Branch and draft PR.** On an item branch, push and open a draft PR stating the objective.
   Otherwise cut `feature/<kebab>` off the default branch first, then do the same.
2. **SPEC** _(gated)_: the section below. On a `replan`, read the trail's `Attempt -` notes first. Each
   one is a road already closed. A broken workspace is not a replan.
3. **PLAN** _(gated)_: the section below.
4. **Settle the graph.** ⚠ Check every task against the **dispatchable bar** in
   `${CLAUDE_PLUGIN_ROOT}/skills/issue-authoring/SKILL.md` first. A settled ticket is built by a cold,
   unattended child that cannot ask you anything. Then `edit_task` each to `spec: settled`, carrying
   its `qa`. Confirm with `get_task`, then stop.

**The gates are yours.** SPEC and PLAN stop for the user, who answers them here. Never wait for a
gate to be relayed.

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

A spike replaces the argument. **State only design positions you have run.**

How deep to spike follows the change:

1. **A variation on a shape that already works** - spike quickly. One question, minutes, enough to
   confirm the shape holds.
2. **A new capability, a change in direction, a simplification or a deletion** - spike heavily, before
   any proposal. No plan is drafted until it answers what the change costs. A deletion also follows
   the rules below.

**Assumptions need evidence**: code that does it, a measurement, or a doc you read.

How a spike runs (a deletion is a spike too):

1. **One test file per question**, its name carrying `spike-<slug>`, committed with the repo's tests as
   written. Reuse the slug in the trail and any resulting claim.
2. **Variants are test cases, not separate scripts.** Options A, B and C are cases in one file, fed
   the canonical example data. A variant that must run inside the app is a candidate, forked below.
3. **The answer survives; the spike graduates or dies.** Append the decision and what was dropped to
   the trail, then record the fact where its reader works. A graduated spike's test stays as the
   re-verification probe. Delete a dead-end spike the same session, and redraft the target program.

A spike's code is never a deliverable: its `contract` and test carry the answer forward. That is what
separates it from `stage: prototype`, which is the first real commit, kept and matured. A spike can
fire mid-grilling: feed the answer back and carry on.

**Run a spike as a fork**, never a fresh subagent. A fork inherits this conversation on a shared
prompt cache, so it costs what it builds rather than what it must be told. One question is one fork,
with no worktree, editing this tree.

**Candidates run side by side**, one fork each, a worktree each, two to four. Name the observable that
decides them **before** you spawn: a criterion chosen afterwards picks whatever the winner happened to
do. Judge on that observable, never on the diff, because you authored neither candidate and a diff
read picks the style you recognise. Every candidate failing is an answer too, and the best one.

**What survives is the whole difference between the two shapes.** A spike per candidate keeps the
answer and discards every worktree. A prototype per candidate keeps the winner's worktree, which
becomes the build's. Read `${CLAUDE_PLUGIN_ROOT}/skills/planning/references/fork-off.md` for the
spawn, the adoption and the cleanup, before you run either.

**The tests are the specification.** Simplification means the same outcome with less machinery.

1. **Keep every test exactly as it is.** Never rewrite a test to fit the new shape.
2. **Delete a test only when its feature is being deleted.** That is a product decision: close the
   target and record the kill in `lessons.md` first.
3. **Run the deletion test first.** Imagine the thing gone. If the complexity vanishes it was a
   pass-through; if it reappears across N callers, it was earning its keep.
4. **Price what you remove before scoping its removal.** "Not worth its cost" needs a number.
5. **Delete one thing at a time.** A verdict applies to the unit measured, not the story it arrived
   in.

### Resolve into the product docs

When a business or technical point crystallises, write it into its doc immediately. Read
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md` for the write-routing rules and
skeletons. Tracked work goes to the `tasks` MCP server via `add_task`, never onto a roadmap row, and
unshipped behaviour is marked _expected_ rather than asserted. The agreed destination goes to the draft
PR and the target's brief; the tasks go to the graph.

**Fog** is a question you can see but cannot yet phrase sharply. The test is whether you can state the
question precisely now, not answer it. Sharp means it can become a task, even if blocked.

**Task, fog and out of scope are MECE**: every piece of known work is exactly one of the three. Out
of scope is work past the destination: a scoping act, not a decision. Record it as one line of what
and why, in the target's brief or the task's scope. Never file it as a new target - a target with no
work under it is a placeholder.

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
When neither the seams nor the reuse ladder settles it, take it back to SPEC and fork a spike per
candidate, under **Spike**. The user picks at a hard gate on the observable; the winner seeds the
graph.

### 2. Task graph - chart only what you can see

**Task what is sharp, fog what is not** (defined in SPEC). Let fog graduate as earlier tasks resolve,
and never pre-slice a fog patch into task-shaped pieces.

Create each task with `add_task` `{ project, id, title, brief, contract, scope: [a **folder**], deps,
qa, spec, target }`.

**No target yet? File one first**, with `add_target { project, id, title, brief }` and its paragraph
in `roadmap.md`. Set a target's `deps` when the sequencing is real, never to express a wish.

**Author with `spec: drafting` while the graph is still forming**, then set each task `settled` once
its `contract` holds. A `drafting` task never drains to a build.

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

**Documentation lands in the stack's last layer.** A documentation-scope task takes a `deps` on every
code task it describes. The schedule derives it into the final layer, where the size floor does not
apply. That covers a README, `docs/`, and a product-memory rewrite. Instruction files that _are_ the
flow's behaviour (`skills/`, `agents/`) are code here, not documentation.

**Two anti-drift lines when they apply.** Skip both for a trivial task.

1. **A do-not-touch list** - files inside the folder that look related but are out of scope, each with
   a one-line reason.
2. **Stop conditions** - an assumption proved false, a file needed outside the folder, or verification
   failing twice.

**Author dependencies, not layer numbers.** `schedule` derives the layers from your `deps`. A layer is
BUILD's unit of work, built by one agent in sequence. It is also a pull request, so size it for a
reviewer, between a floor and a ceiling:

1. **Under ~100 added lines** - too small. Merge it into its neighbour.
2. **500 to 700** - the target. One sitting, one decision.
3. **Over 1000** - too big. Split it.

Estimate at the gate from each task's scope, catching the layer that is obviously 2,000 lines or 40.
**Merge a layer into its neighbour unless it is independently reviewable**, meaning someone could
accept or reject it on its own terms. Split by _decision_, never by _file_ or _step_: real
dependencies force a split, tidiness does not, and a large indivisible change ships whole.

**The last layer makes the target program run.** Its tasks produce the stated output of the program in
`.claude/architecture.md`.

**Stamp the base.** Record the commit the graph was planned against (`git rev-parse --short HEAD`) as
a `Planned-at:` `append_trail` note on the task.

**Reproduce before you reject.** Explain any "won't work" in the grill's four-part failure shape.

### Maturity staging - optional, large or uncertain deliverables only

A big or unfamiliar deliverable can mature in visible stages instead of one commit. Express it as a
`deps` chain over the same scope, each task tagged with a `stage`:

- **prototype** is the thinnest end-to-end slice that runs, plus the examples and trade-off note that
  show the shape. When the shape itself is the open question, fork a prototype per candidate and keep
  the winner's worktree, under **Spike**.
- **build** hardens that slice to the `contract`, and drops what did not survive the prototype.
- **sweep** aligns to existing patterns across the touched files, dedupes, and deletes scaffolding.

Stages land in successive layers because each one `deps` on the last. **Default to a single task**;
staging is opt-in, never a blanket pipeline. Promote sweep to its own task only when the cleanup is
cross-layer. A `stage` is a label: ordering is still the `deps` you author.

### Anchors

**Every structural assertion the graph rests on has an anchor.** Classify each before its task is
filed.

1. **About this repo** - anchored in the code and `architecture.md`, verified by reading or running it
   now.
2. **About an external dependency** - anchored in a `kind: limitation` architecture entry or a
   CLAUDE.md rule, carrying its re-verification probe.
3. **Neither** - an assumption, not an anchor. Validate it now with a spike recorded where its reader
   works, or fog it.

**PLAN gate:** preview the derived schedule for the user by calling the `tasks` MCP tool `schedule`
`{ project }`.

Present it, not a wall of prose. Lead with one line on what the plan builds. Then each task's
`contract` as the worked example, and only the layer detail the decision needs. The
`contract` is agreed here, so wait for an explicit OK. On a scope or contract change, `edit_task` the
affected task or reshape the graph, then re-preview. This is the last gate.
