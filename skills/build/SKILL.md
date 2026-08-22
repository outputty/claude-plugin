---
name: build
description: outputty BUILD stage - build a settled task hands-off, one stacked PR per layer, one master QA after the graph drains, then merge. Triggers on /outputty:build <id>; a session told to build invokes it before anything else.
---

# outputty - BUILD stage

Input: one settled task id, and the branch to build it on. Output: a merged stack, one PR per layer.

**Two exits only: the replan exit below, and an escalation.** Neither asks the user a question, because
nobody watches this pane. Otherwise run the item to its merge, then report.

**Needs** a git repo, a GitHub remote, authenticated `gh`, and `gh extension install github/gh-stack`.
There is no single-PR fallback.

## Your steps

1. **Claim the task, first**: `start_task` `{ project, id }`. This is the very first tool call of the
   session, before you read anything.
2. **ORIENTATION** - publish what you understood.
3. **BUILD** - the section below. One layer, one PR, stacked.
4. **MASTER QA**, once, after the graph drains.
5. **Merge** - the final section.

**Read the trail's `Attempt -` notes with `get_trail` before choosing an approach.**

## The replan exit - the only way a build stops early

**A requirements gap is not a question.** It is a replan. The moment you cannot proceed without a ruling
nobody has made, stop. Never guess, and never take the cheapest reading.

1. **Scratch what you built** on that gap. Never leave half-built work against a wrong requirement.
2. **Record the attempt** with `append_trail` `{ project, id, kind: "note" }`, in this fixed shape:
   `Attempt - tried: <what you built>. Killed by: <what stopped it, with the file:line or run that proves
   it>.` Both halves are required. Write it for a reader who was not here.
3. **Set `spec: replan`** and report.

**Escalate rather than replan when the blocker is not a requirements gap**: a broken environment, a
missing credential, a nonexistent dependency, an absent `tasks` server. Planning cannot answer those.

## ORIENTATION - publish what you understood

**Every build writes this**, with no exception and no short form. `append_trail` it as one `note` on
the task, and print it in the pane. Write it after `start_task`, before the first layer.

**1. Restate**, in three lines: the **problem** in the reader's terms, what you are **building**, and
**done when** as one checkable condition.

**2. Validate every claim the ticket makes.** A ticket is a claim set, not a fact set. List every claim
with a verdict and an anchor. `grill` defines each verdict, and this list adds only what a build does with
it.

1. **Grounded** - cite the `file:line` and move on.
2. **Absent** - say so. Conclusion survives without it → `amend_task` `{ project, id, brief }`, then
   build. Conclusion falls with it → **replan**.
3. **Unknown** - blocking → **replan**. Not blocking → carry it as a stated assumption.

**An Unknown you carry is an assumption on the record.** It is the only form an open question may take
inside a build.

**3. Draft the solution**, once the ledger is clean. Two artifacts, both before any code:

- **Where it lands.** A call stack graph: the entry point on the first line, the calls down to your change,
  your change marked `NEW`. Leave the untouched neighbours in, so the blast radius shows.
- **The tests, red first.** The numbered `contract` cases you write before any code, each failing first.

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

You build every layer yourself. There is no build agent and no per-layer QA. **This checkout is the one
place investigation is not read-only**: you edit it.

**`CHECKS` is your early warning, not a reviewer.** Add a test whenever you add a surface.

### Before the first layer

1. **Compact the session.** Once, here, not per layer.
2. **Green baseline, and capture `CHECKS`.** Run the repo's own test, build and lint. A red baseline means
   stop and surface it. **The repo owns how its tests run** - read its `CLAUDE.md`, README or manifest
   scripts and take the commands from there. Never prescribe a runner.
3. **Start the suite in watch mode, in the background** - your green signal. Without watch mode, say so
   once and run `CHECKS`. A **docs-only** ticket touches no code, so skip this.
4. **Derive the layers.** Call `schedule` `{ project }`, the repo root. It rejects cycles and unmet deps.
5. **Allowlist what the build runs** so nothing stalls on a prompt: `CHECKS`, `git`, `git push`, `gh`. Add
   the four to `permissions.allow` in `.claude/settings.local.json`, never in the committed
   `.claude/settings.json`. The `tasks` MCP tools need no allowlist.

### The layer loop

Per layer, in order.

**1. Is this still the right work?** Read `roadmap` `{ project }` and this branch's trail now, never from
memory of PLAN. The trail's `Planned-at:` note names the commit that PLAN worked from. Diff it against
HEAD to see the drift. **Report only what changed since Orientation**, so a steady answer costs one line.
Four questions:

- Which **target** does it still serve? `get_task` names it. A target still waiting is fine; a target that
  nothing needs any more is not.
- Does the `contract` match the seams as they now stand?
- Has some of it already happened?
- Can you state "done" in one sentence?

Then act on the verdict:

1. **Still right** - build it.
2. **Right work, stale words** - `amend_task` `{ project, id, brief }`, then build. Say what you changed.
3. **Already done** - `close_task` `{ project, id }`, plus one line in the recap naming what did it.
4. **No longer serves the roadmap** - **escalate**. That is a product decision, not yours.

**2. Build it.** Turn each task's `contract` into a failing test, then write the code that passes it. Apply
the code rules (`${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md`); they govern this diff.

**3. Prove it green.** Touch a marker file before you edit. With the watcher running, read its latest
result for the red-to-green transition, and only when that result is newer than the marker. Anything older
is no signal, so run `CHECKS` instead. Without a watcher, run `CHECKS`. Never infer green. **A docs-only or
config-only layer changed no code**, so skip this step. The merge gate still runs the full suite once on
the final state.

**4. Commit, stack, publish.** Cut `feature/<x>-l<N>` off the previous layer's branch **before** you
commit. Per task, **call `close_task` `{ project, id }` first, then a scoped `git add`** of the task's
files. The close then ships inside the layer that did the work. Write the layer's write-up to
`tmp/layer-<N>.md` in the format `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`
enforces, and pass that path to `gh pr edit`.

```bash
git checkout -b feature/<x>-l<N>               # off the previous layer's branch, not off main
# … commit stage runs here …
gh stack add feature/<x>-l<N>                  # first layer instead: gh stack init <branch> <branch>
gh stack submit --auto                          # push + open/update the PRs as drafts
gh pr edit <n> --title "<the write-up's heading>" --body-file tmp/layer-<N>.md
```

**Set the title explicitly.** The title is the write-up's `## <what this layer did>` heading.

Two flags are hands-off traps:

1. **`gh stack init`** - with no arguments it demands interactive input. Always pass the branch names,
   which you have from `schedule`.
2. **`gh stack submit`** - it opens an editor unless you pass `--auto`. That flag creates new PRs as
   drafts.

**Name layers with a hyphen, never a slash.** Git rejects `feature/<x>/l1` once `feature/<x>` exists as a
branch. A rebase conflict between layers is an **escalation**, never force-resolved inside a hands-off
build.

**5. Print the recap.** Cumulative.

```markdown
**Layers**

1. `1 · engine` - unified the two write paths - merged

**Issues caught**

1. A test asserted on a stale fixture, in the staleness check - fixed, rebuilt from real data

**Next**

1. `Layer 2 · wire the CLI` - the last planned layer, and it depends on 1
```

**Every deferred issue names the task it became.** Name work, never a bare id: `Drain the barrel
re-exports` (`t-31`).

### Keep the happy path green

This outranks finishing the task.

1. **The working program keeps working** - cleanup, refactors and dedup are behaviour-preserving. A suite
   that goes red, or a target program that stops running, means the change is wrong, never the test. Never
   make a failing test pass by weakening, deleting or skipping its assertion.
2. **Land what is good, park what is not** - a task can split into clean fixes and one contentious one.
   Commit and push everything that passes, then file the rest as its own task. Never hold finished green
   work hostage to a sibling in doubt, and never jam the doubtful one in to keep the set whole.
3. **"It breaks everything" is the one stop condition** - the rest cannot go green without a decision.
   Commit what is green, leave the tree working, and escalate.

### Escalate rather than guess

Widen a scope yourself with `amend_task` `{ project, id, scope: [<folder>] }` whenever you can. Otherwise
stop and escalate. **Every escalation carries four parts:**

1. What you expected.
2. What the build did.
3. What still does not hold, with the run that proves it.
4. The options, 2 to 4 of them, recommendation first.

Each case below adds one more thing to that shape.

1. **A task no longer serves the roadmap** - the flow change as a graph.
2. **A fix fails twice after a real diagnosis** - both diagnoses, and the second fix.
3. **The graph and the code disagree** - the graph's claim beside the code that answers it.
4. **A done-condition needs a scope you cannot widen yourself** - the folder you need, and why widening it
   is not yours.

Print the recap under it. Nothing merges on an escalation. Then ring the doorbell, because the graph cannot
show a stop:

```text
tasks MCP: notify { project, note: "escalation on <id> - pane <name>" }
```

### The graph has drained

**1. Drain discovered work, then hand over green.** Call `list_ready` `{ project }`. While it returns
tasks, build them as another layer. Only `discovered_from` tasks may drain; an original in `list_ready`
means its commit never closed it. Confirm green from the watcher before review.

**2. Review the build, at the level PLAN set.** The level is the **strongest `qa`** among the tasks this
build drained, `subagent` by default. It is PLAN's call, so a build never downgrades its own review.

1. **`subagent`** - dispatch `outputty:outputty-reviewer` with the charter's `effort: xhigh` and
   `run_in_background: false`. Pass no model: the reviewer inherits this session's, so the task's `tier`
   already set it. Brief it from the template below.
2. **`inline`** - load `${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md` and follow it on your own diff, with no
   subagent.
3. **`skip`** - no reviewer. Follow qa's `skip` bullet in `${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md`, then
   go to **Merge**. `CHECKS` green plus that one run is the pass.

**At `subagent`, write the brief from this template.** It carries what to judge, and nothing about how to
read.

```text
Load ${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md whole. It is your charter for this run.
LEVEL: subagent
PROJECT: <repo root, the argument every tasks MCP call takes>

Master QA for <target or task ids>, branch stack <bottom>..<top> (PRs #<n>-#<n>).
You are on <branch> in <checkout path>.

SETTLED: <the rulings from the trail that constrain the build, one line each>
DEFERRED: <what was ruled out of scope, so you do not report it as missing>

THE REAL RUN: <the exact command> - expect <the stated counts or output>.
PER-TASK OUTPUT: <each task's done-condition or proof command, one per line>

JUDGE: <the specific questions this build raises, numbered>
```

Then route the verdict:

1. **`pass`** - go to **Merge** and run it.
2. **`fail` · salvage** - `add_task` its tasks, build them, then run master QA again.
3. **`fail` · rewrite** - **escalate**.
4. **`fail` twice** - **escalate**, whatever it recommends.

### While you build

**No memory is written during a build.** Lessons are collected once, at the merge retrospective. Never gate
a commit on a clean `git status`.

## Merge - one sitting, on a `pass` verdict or a skipped review

First turn each review comment into a task (`add_task` `{ project, id, title, discovered_from }`) and run
another layer. Repeat until the PR is clean.

1. **Distill the trail into the product docs**, each decision to its one home. A new feature or knob gets a
   row in `architecture.md`'s feature index, plus its own section in the machinery or seams. Close
   stragglers, prune stale prose, and run any behaviour you mark done.
2. **Record the cycle's pivots in `lessons.md`** - one bold-title-led entry per abandoned or reversed
   approach, each naming its trail. A bug fix or a successful retry earns none.
3. **Bring every other doc in line** - the README and `docs/` (use the `documentation` skill for the
   README). Delete documentation that has no reader. Say what you cut, one line each.
4. **Retrospect.** Persist only what speeds the next cycle: distil, route, prune. Route the durable lesson
   to auto-memory. Mint a skill only for a proven, reusable, multi-step procedure (invoke
   `anthropic-skills:skill-creator`); most cycles mint none.
5. **Summarise the cycle for the user.** Give one base program, then a numbered case per capability, each
   titled by the user's problem. Each case shows `Before:` and now, in real observed output.
6. **Finalize the PR.** Re-read the original ask, confirm the branch does exactly that and no more, and run
   `CHECKS` on the final state. Write the body to the format in
   `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`.
7. **Green-gate the merge.** ⚠ Close each task **before** the merge, never after. Commit and push the merge
   artifacts to the **top** branch; nothing merges uncommitted. Mark every PR ready (`gh pr ready <n>`) and
   land the stack atomically:

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```
