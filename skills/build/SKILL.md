---
name: build
description: outputty BUILD stage - build a settled roadmap target hands-off, its task set as one stacked PR per layer, one master QA after the graph drains, then the docs layer and the merge. Triggers on /outputty:build <id>; a session told to build invokes it before anything else.
---

# outputty - BUILD stage

Input: one roadmap target, in a worktree of your own. Output: its whole task set as one merged stack,
one PR per layer, and a report.

**Two exits only: the replan exit below, and an escalation.** Neither asks a question - that is
physics, not policy, because `AskUserQuestion` is stripped from every subagent. A build that will not
replan guesses instead, invisibly. Otherwise run the item to its merge, then report.

**Needs** a git repo, a GitHub remote, authenticated `gh`, and `gh extension install github/gh-stack`.
There is no single-PR fallback.

## Your steps

1. **Read your target, first**: `roadmap` `{ project }`, the session's very first call. Your row's
   `ready` names the tasks to build, and `progress` says how many the target holds. **Claim each task
   with `start_task` `{ project, id }` as you reach its layer.** That also starts the heartbeat a
   dispatcher reads to tell a working build from a dead one. The target's own claim is the
   dispatcher's.

   ⚠ **A target is self-contained**, so every dep your tasks carry points inside it. A dep pointing
   out is a planning defect: report it and stop, because that graph is not buildable as one stack.
2. **Stand in your worktree, then cut your branch.** `git rev-parse --show-toplevel` names your
   footing:

   1. **A path under `.claude/worktrees/`** - your worktree, on the remote default branch. Run
      `git checkout -b feature/<kebab>` there and build.
   2. **The primary checkout** - isolation fell through. Recut and enter it. Resolve the default
      branch first, then spell what it printed into the second call:

      ```bash
      git symbolic-ref --short refs/remotes/origin/HEAD
      ```

      ```bash
      git worktree add .claude/worktrees/<kebab> -b feature/<kebab> <the branch it printed>
      ```

      then `EnterWorktree` `{ path: ".claude/worktrees/<kebab>" }`, and the probe prints the
      worktree.

   Trust the probe over the brief; the report names your footing.

3. **ORIENTATION** - publish what you understood.
4. **BUILD** - the section below. One layer, one PR, stacked.
5. **MASTER QA**, once, after the graph drains.
6. **Merge** - the final section.
7. **Report** - the only thing that reaches the dispatcher.

**Read the trail's `Attempt -` notes with `get_trail` first.**

## The replan exit - the only way a build stops early

**A requirements gap is a replan, not a question.** The moment you cannot proceed without a ruling
nobody has made, take the exit below.

1. **Scratch what you built** on that gap, so the tree holds only work against a settled requirement.
2. **Record the attempt** with `append_trail` `{ project, id, kind: "note" }`, in this fixed shape:
   `Attempt - tried: <what you built>. Killed by: <what stopped it, with the file:line or run that
   proves it>.` Both halves are required. Write for a reader who was not here.
3. **Set `spec: replan`**, then report. The replan is yours to write: you hold the evidence, and
   nothing above you saw the gap.

**Escalate instead when the blocker is not a requirements gap**: a broken environment, a missing
credential, a nonexistent dependency, an absent `tasks` server. Planning cannot answer those.

## The spike branch - a ticket whose deliverable is a ticket

**A ticket tagged `spike` answers an empirical question; it does not ship code.** Check `tags` on
`get_task` first. On a spike, read `${CLAUDE_PLUGIN_ROOT}/skills/build/references/spike.md` and follow
it in place of BUILD, MASTER QA and Merge. ⚠ Nothing merges on a spike.

## ORIENTATION - publish what you understood

**Every build writes this**, with no exception and no short form. `append_trail` it as one `note`
after `start_task`, before the first layer.

**1. Restate**, in three lines: the **problem** in the reader's terms, what you are **building**, and
**done when** as one checkable condition.

**2. Validate every claim the ticket makes.** A ticket is a claim set, not a fact set. List every
claim with a verdict and an anchor. `grill` defines the verdicts; this adds what a build does with
them.

1. **Grounded** - cite the `file:line` and move on.
2. **Absent** - say so. Conclusion survives without it → `amend_task` `{ project, id, brief }`, then
   build. Conclusion falls with it → **replan**.
3. **Unknown** - blocking → **replan**. Not blocking → carry it as a stated assumption.

**An Unknown you carry is an assumption on the record.** It is the only form an open question may take
inside a build.

**3. Draft the solution**, once the ledger is clean. Two artifacts, both before any code:

- **Where it lands.** A call stack graph: the entry point first, the calls down to your change, your
  change marked `NEW`. Leave the untouched neighbours in, so the blast radius shows.
- **The tests, red first.** The numbered `contract` cases, each failing before any code.

Write the whole note in this shape:

```markdown
## <task id> - ORIENTATION

**Problem:** <theirs> · **Building:** <what lands> · **Done when:** <one checkable condition>

**Claims**

1. `<the ticket's claim, verbatim>` - **Grounded** at `path:line` - build on it

**Where it lands**

	main()
		route()
			handle()        NEW

**Tests, red first**

1. `<contract case 1>` - <the assertion that fails today>
```

## BUILD - you build it, one gate at the end

You build every layer yourself. No build agent, no per-layer QA. **This checkout is the one place investigation is
not read-only**: you edit it.

**`CHECKS` is your early warning, not a reviewer.** Add a test with every surface.

### Before the first layer

1. **Compact the session**, once, here.
2. **Green baseline, and capture `CHECKS`.** Run the repo's own test, build and lint; a red baseline
   stops you. **The repo owns how its tests run** - take the commands from its `CLAUDE.md`, README or
   manifest scripts.
3. **Start the repo's own watcher, in the background** - your green signal. Run the watch loop the
   repo's `CLAUDE.md` names (Wallaby, a watch script); with none named, the suite's watch mode.
   Without one, say so once and run `CHECKS`. A **docs-only** ticket touches no code, so skip this.
4. **Derive the layers** with `schedule` `{ project, target }`, which returns your target's layers
   alone. It rejects cycles, and it reports a dep on unshipped work outside the target as an unmet
   dependency. That is a mis-scoped target, so report it and stop.
5. **Cover `CHECKS` in the allowlist** - `permissions.allow` in the committed `.claude/settings.json`,
   seeded with `git` and `gh` by `init`. Add any `CHECKS` command it misses; the edit ships in this
   layer's diff, so every later worktree inherits it. A prompt you stall on surfaces to the attended
   dispatcher.

### The layer loop

Per layer, in order.

**1. Is this still the right work?** Read `roadmap` `{ project }` and this branch's trail now, and answer
from what they return. The trail's `Planned-at:` note names the commit PLAN worked from; diff it against
HEAD for the drift. **Report only what changed since Orientation.** Four questions:

- Which **target** does it still serve? `get_task` names it. A target still waiting is fine; one
  nothing needs any more is not.
- Does the `contract` match the seams as they now stand?
- Has some of it already happened?
- Can you state "done" in one sentence?

Then act on the verdict:

1. **Still right** - build it.
2. **Right work, stale words** - `amend_task` `{ project, id, brief }`, then build. Say what changed.
3. **Already done** - `close_task` `{ project, id }`, and name what did it in the report.
4. **No longer serves the roadmap** - **escalate**. That is a product decision, not yours.

**2. Build it.** Turn each task's `contract` into a failing test, then write the code that passes it.

⚠ **This layer leaves the program working.** It merges as its own PR, so the new path lands beside the
old one, or behind the flag PLAN authored. A layer that only half-cuts over ships a broken default
branch.

**One writer, unless the scopes are disjoint.** Two tasks may be built at once only when their `scope`
folders are pairwise disjoint: no shared folder, neither containing the other. Everything else is one
writer in sequence, because same-target tasks are packed for file overlap, and two writers over one
file interleave their commits.

On a disjoint pair, one background `general-purpose` agent per task, each with
`isolation: "worktree"`. Its worktree is cut from your `HEAD`, so it starts on this layer's base. Each
writer commits on its own branch and reports it. You cherry-pick them into the layer branch, in id
order. ⚠ **A conflict proves they were not disjoint.** Stop, keep the first, and report the pair. Each
writer pays a cold boot, so spend one on a real chunk of work rather than to save minutes.
The code rules (`${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md`) govern this diff.

**3. Prove it green.** Touch a marker file before you edit. Read the watcher's latest result for the
red-to-green transition, and only when it is newer than the marker. An older result, or no watcher,
is no signal: run `CHECKS`. Green comes from a run you read. **A docs-only or config-only layer
changed no code**, so skip this. The merge gate runs the full suite on the final state anyway.

**4. Commit, stack, publish.** Cut `feature/<x>-l<N>` off the previous layer's branch **before** you
commit. Per task, **`close_task` `{ project, id }` first, then a scoped `git add`** of its files, so
the close ships inside its layer. Write the layer's write-up to `tmp/layer-<N>.md`
in the format `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` enforces.

```bash
git checkout -b feature/<x>-l<N>
# … commit stage runs here …
gh stack add feature/<x>-l<N>                  # first layer instead: gh stack init <branch> <branch>
gh stack submit --auto                          # push + open/update the PRs as drafts
gh pr edit <n> --title "<the write-up's heading>" --body-file tmp/layer-<N>.md
```

Two flags are hands-off traps:

1. **`gh stack init`** demands interactive input with no arguments - pass the branch names
   `schedule` gave you.
2. **`gh stack submit`** opens an editor without `--auto`, which also creates new PRs as drafts.

**Name layers with a hyphen**, as `feature/<x>-l1`. Git rejects `feature/<x>/l1` once `feature/<x>`
exists as a branch. A rebase conflict between layers is an **escalation**: report it and stop.

**5. Note what the report will carry**: the layer, the issues caught, and anything deferred. **Every
deferred issue names the task it became** - the work, then its id: `Drain the barrel re-exports`
(`t-31`).

### Keep the happy path green

This outranks finishing the task.

1. **The working program keeps working** - cleanup, refactors and dedup are behaviour-preserving. A
   red suite, or a target program that stops running, means the change is wrong: fix the change and
   leave the assertion as it stands.
2. **Land what is good, park what is not** - commit and push everything that passes, then file the
   rest as its own task. Finished green work ships on its own, and the sibling in doubt waits in its
   task.
3. **"It breaks everything" is the one stop condition.** Commit what is green, leave the tree
   working, and escalate.

### Escalate rather than guess

Widen a scope yourself with `amend_task` `{ project, id, scope: [<folder>] }` when you can. Otherwise
stop and escalate. **Every escalation carries four parts:**

1. What you expected.
2. What the build did.
3. What still does not hold, with the run that proves it.
4. The options, 2 to 4 of them, recommendation first.

Each case adds one thing to that shape.

1. **A task no longer serves the roadmap** - the flow change as a graph.
2. **A fix fails twice after a real diagnosis** - both diagnoses, and the second fix.
3. **The graph and the code disagree** - the graph's claim beside the code that answers it.
4. **A done-condition needs a scope you cannot widen** - the folder, and why widening is not yours.

Print the recap under it. Nothing merges on an escalation. **The escalation is also your report**, so
it carries the whole message - nobody can ask you a follow-up once you exit.

### The graph has drained

**1. Drain discovered work, then hand over green.** Call `list_ready` `{ project }`; while it returns
tasks, build them as another layer. Only `discovered_from` tasks may drain - an original in
`list_ready` means its commit left it open, so close it. Confirm green before review.

**2. Review the build, at the level PLAN set** - the **strongest `qa`** among the tasks this build
drained, `subagent` by default. PLAN sets that level, and the build runs it as set.

1. **`subagent`** - dispatch `outputty:outputty-reviewer` with the charter's `effort: xhigh` and
   `run_in_background: false`, and pass no model: it inherits this session's. Brief it from the
   template below. Depth stays inside the limit, because you are already a child.
2. **`inline`** - load `${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md` and follow it on your own diff.
3. **`skip`** - follow qa's `skip` bullet in that same file, then go to **the documentation layer**.
   `CHECKS` green plus that one run is the pass.

**At `subagent`, write the brief from this template.** It says what to judge, and `qa` says how to read.

```text
Load ${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md whole. It is your charter for this run.
LEVEL: subagent
PROJECT: <repo root>

Master QA for <target or task ids>, branch stack <bottom>..<top> (PRs #<n>-#<n>).
You are on <branch> in <checkout path>.

SETTLED: <the trail's rulings that constrain the build, one line each>
DEFERRED: <what was ruled out of scope, so it is not reported as missing>

THE REAL RUN: <the exact command> - expect <the stated counts or output>.
PER-TASK OUTPUT: <each task's done-condition or proof command, one per line>

JUDGE: <the specific questions this build raises, numbered>
```

Then route the verdict:

1. **`pass`** - go to **the documentation layer**, then **Merge**.
2. **`fail` · salvage** - `add_task` its tasks, build them, then run master QA again.
3. **`fail` · rewrite** - **escalate**.
4. **`fail` twice** - **escalate**, whatever it recommends.

### While you build

**Memory is written at the merge retrospective alone**, so a commit inside the build ships on a green
`CHECKS` alone.

## The documentation layer - written after the verdict, shipped as the top PR

**A stack of more than one layer documents itself here**, after master QA passed and before the merge.
The docs task PLAN filed is the last layer, so this is one more turn of the layer loop. Build it,
commit it and `gh stack add` it, and it becomes the top PR of the same stack. Nothing separate merges,
and nothing waits in the queue.

1. **It covers** the README (via the `documentation` skill), `docs/`, and the docstrings the diff
   earned. Delete documentation that has no reader, and say what you cut.
2. **It leaves product memory to the merge.** `architecture.md`, `lessons.md` and `roadmap.md` are
   distilled below, because the next planning session reads them.
3. **No second master QA.** The layer is written against a diff that just passed.

**A single-layer stack skips this** and documents inline, where the one PR already carries it.

## Merge - one sitting, on a `pass` verdict or a skipped review

First turn each review comment into a task (`add_task` `{ project, id, title, discovered_from }`) and
run another layer, until the PR is clean.

1. **Distill the trail into the product docs**, each decision to its one home. A new feature or knob
   gets a row in `architecture.md`'s feature index plus its own section. Close stragglers, prune stale
   prose, and run any behaviour you mark done.
2. **Record the cycle's pivots in `lessons.md`** - one bold-title-led entry per abandoned or reversed
   approach, each naming its trail. A bug fix or a successful retry earns none.
3. **Close the target** you were dispatched with, once its whole task set has shipped. A target
   whose tasks are not all done stays open, and your report says which remain.
4. **Retrospect.** Persist only what speeds the next cycle, and route the durable lesson to
   auto-memory. Mint a skill only for a proven, reusable, multi-step procedure
   (`anthropic-skills:skill-creator`); most cycles mint none.
5. **Finalize the PR.** Re-read the original ask, confirm the branch does that and no more, and run
   `CHECKS` on the final state. Write the body to the format in
   `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`.
6. **Green-gate the merge.** ⚠ Close each task **before** the merge. Commit and push the
   merge artifacts to the **top** branch; nothing merges uncommitted. Mark every PR ready
   (`gh pr ready <n>`) and land the stack atomically:

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```

## Report - the only thing that reaches the dispatcher

You run unattended and exit when done, and nothing can query you afterwards. The report therefore
carries everything a reader needs. One of three shapes:

1. **Merged** - the stack refs and PR numbers, the master QA verdict quoted, and one line per layer.
   Then the issues caught, and every deferred item named as work.
2. **Replan** - the `Attempt -` note verbatim, and what ruling is missing. Nothing merged.
3. **Escalation** - the four-part shape above, in full. Nothing merged.

**Report the merge you made, as `gh` returned it.** A dispatcher relays your verdict without re-running
it: your report is the record.
