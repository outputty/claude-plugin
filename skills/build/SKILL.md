---
name: build
description: outputty BUILD stage - build a settled task hands-off, one stacked PR per layer, one master QA after the graph drains, then merge. The orchestrator dispatches this as a child session's first prompt (/outputty:build <id>); a session told to build invokes it before anything else.
---

# outputty - BUILD stage

**You are a BUILD session**, with the CLAUDE.md outputty block already in context. Your task's
requirements are settled. You build it unattended. **Two exits only: the replan exit below, and an
escalation.** Neither asks the user a question, because nobody watches this pane.

## Your steps

0. **Claim the task, first**: `start_task` `{ project, id }`. This is the very first tool call of the
   session, before you read anything. It sets the task `in_progress`. That takes it out of `list_ready`,
   so nobody dispatches it twice, and moves its board card to In Progress. You do not release it
   by hand - closing the task clears it, and so does `spec: replan`.
1. **ORIENTATION** - publish what you understood. Every build, no exceptions.
2. **BUILD** - the section below. One layer, one PR, stacked.
3. **MASTER QA**, once, after the graph drains. The build's only real run.
4. **Merge** - the final section, run once on a `pass` verdict or a skipped review.

**Read the task's `attempts` before choosing an approach.** If this task has been through a replan, each
entry names a road already closed.

## The replan exit - the only way a build stops early

**A requirements gap is not a question. It is a replan.** The moment you cannot proceed without a ruling
nobody has made, stop. Never guess, never take the cheapest reading, never sit waiting unwatched.

1. **Scratch what you built** on that gap. Never leave half-built work against a wrong requirement.
2. **Append an `attempts` entry**: what you tried, what killed it, and the file:line or run that proves it.
   `tried` and `killed_by` are both required.
3. **Set `spec: replan`** and report. The task leaves your stage and planning picks it up. The replan
   releases your claim: the task goes back to `open` and reappears in `list_ready` on its own.

Write that entry for a reader who was not here.

**Escalate rather than replan when the blocker is not a requirements gap**: a broken environment, a
missing credential, a nonexistent dependency, an absent `tasks` server. Planning cannot answer those.

**Run this item to its merge, then report.** A build's report is never a stop before the merge.

**Needs** a git repo, a GitHub remote, authenticated `gh`, and `gh extension install github/gh-stack`.
There is no single-PR fallback.

## ORIENTATION - publish what you understood

**Every build writes this. There is no exception and no short form.** `append_trail` it as one `note` on
the task, and print it in the pane. The trail is the record QA reads and it survives a compaction; the
pane is your live view. Write it after `start_task`, before the first layer.

**1. Restate**, in three lines: the **problem** in the reader's terms, what you are **building**, and
**done when** as one checkable condition.

**2. Validate every claim the ticket makes.** A ticket is a claim set, not a fact set, and it was written
before the code moved. List every claim with a verdict and an anchor. **`grill` defines what each verdict
means; this table adds only what a build does with it.**

| Verdict | You do |
| --- | --- |
| **Grounded** | cite the `file:line` and move on |
| **Absent** | say so. Conclusion survives without it → `amend_task`, then build. Conclusion falls with it → **replan** |
| **Unknown** | blocking → **replan**. Not blocking → carry it as a stated assumption |

**An Unknown you carry is an assumption on the record**, which is what makes it checkable by QA. It is the
only form an open question may take inside a build. Anything blocking is a replan, never a note.

**3. Draft the solution**, once the ledger is clean. Two artifacts, both before any code:

- **Where it lands.** A call stack graph, per the writing standard: entry point at the top, the calls down
  to your change, your change marked `NEW`. Leave the untouched neighbours in, so the blast radius shows.
- **The tests, red first.** The numbered `contract` cases you will write BEFORE any code, each failing
  first.

Write the whole note in this shape:

```markdown
## <task id> - ORIENTATION

**Problem:** <theirs> · **Building:** <what lands> · **Done when:** <one checkable condition>

| Claim | Verdict | Anchor | You do |
|---|---|---|---|
| <the ticket's claim, verbatim> | Grounded | `path:line` | build on it |

**Where it lands**

	main()
		route()
			handle()        NEW

**Tests, red first**

1. `<contract case 1>` - <the assertion that fails today>
```

## BUILD - you build it, one gate at the end

You build every layer yourself. There is no build agent and no per-layer QA.

**`CHECKS` is your early warning, not a reviewer.** Add a test whenever you add a surface.

### Before the first layer

1. **Compact the session.** Once, here, not per layer.
2. **Green baseline, and capture `CHECKS`.** Run the repo's own test, build and lint. A red baseline means
   stop and surface it. **The repo owns how its tests run** - read its `CLAUDE.md`, README or manifest
   scripts and take the commands from there. Never prescribe a runner.
3. **Start the suite in watch mode, in the background** - your green signal. Without watch mode, say so
   once and run `CHECKS`. A **docs-only** ticket touches no code, so skip this.
4. **Derive the layers.** Call `schedule` with `{ project }` (the repo root). It rejects cycles and unmet
   deps. Every task op below is a `tasks` MCP tool taking `{ project }`.
5. **Allowlist what the build runs** so nothing stalls on a prompt: `CHECKS`, `git`, `git push`, `gh`. Add
   the four to `permissions.allow` in `.claude/settings.local.json`, never in the committed
   `.claude/settings.json`. A session started `--permission-mode auto` already holds them. The `tasks` MCP
   tools need no allowlist.

### The layer loop

Per layer, in order.

**1. Is this still the right work?** Call `sync`, then `roadmap` `{ project }` and this branch's trail.
Read them now, not from memory of PLAN. The trail's `Planned-at:` note names the commit that PLAN worked
from. Diff it against HEAD to see the drift. **Report only what CHANGED since Orientation**, so a steady
answer costs one line. Four questions:

- Which **target** does it still serve? `get_task` names it; `roadmap` says where that target stands
  and what it is still waiting on. A task whose target is waiting is not wrong; the queue ranked it
  accordingly. But a task under a target nothing needs any more is.
- Does the `contract` match the seams as they now stand?
- Has some of it already happened?
- Can you state "done" in one sentence?

| Verdict | You do |
| --- | --- |
| still right | build it |
| right work, stale words | `amend_task` `{ project, id, brief }`, then build. Say what you changed. |
| already done | `close_task` `{ project, id }`, one line in the recap naming what did it |
| no longer serves the roadmap | **escalate - that is a product decision, not yours** |

**2. Build it.** Test-first: turn each task's `contract` into a failing test, then write the laziest diff
that passes it. Apply the code rules (`${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md`); they govern this
diff.

**3. Prove it green.** Touch a marker file before you edit. With the watcher running, **read its latest
result** for the red-to-green transition. Read it only when it is newer than the marker. A result older
than your edit is no signal, so run `CHECKS` instead. Without a watcher, run `CHECKS`. Never infer green.
**A docs-only or config-only layer changed no code**, so skip this step. The merge gate still runs the
full suite once on the final state.

**4. Commit, stack, publish.** Cut `feature/<x>-l<N>` off the previous layer's branch **before** you
commit. Per task, call **`close_task` `{ project, id }` FIRST, then a scoped `git add`** of the task's
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

**Two flags are hands-off traps:**

| Command | Trap |
| --- | --- |
| `gh stack init` | With **no arguments it demands interactive input**. Always pass the branch names, which you have from `schedule`. |
| `gh stack submit` | **Opens an editor** unless you pass **`--auto`**, which creates new PRs as **drafts**. |

**Name layers with a hyphen, never a slash.** Git rejects `feature/<x>/l1` once `feature/<x>` exists as a
branch. A rebase conflict between layers is an **escalation**, never force-resolved inside a hands-off
build.

**5. Print the recap.** Cumulative.

```markdown
| Layer | What it did | State |
|---|---|---|
| 1 · engine | unified the two write paths | ✅ merged |

| Issue caught | Where | Resolution |
|---|---|---|
| test asserted on a stale fixture | the staleness check | ✅ fixed - rebuilt from real data |

| Next | Why it's next |
|---|---|
| Layer 2 · wire the CLI | last planned layer; depends on 1 |
```

**Every deferred issue names the task it became. Name work, never a bare id**: `Drain the barrel
re-exports` (`t-31`).

### Keep the happy path green

This outranks finishing the task.

| Rule | What it means |
| --- | --- |
| **The working program keeps working** | Cleanup, refactors and dedup are behaviour-preserving. If the suite goes red or the target program stops running, the change is wrong, not the test. Never make a failing test pass by weakening, deleting or skipping its assertion. |
| **Land what is good, park what is not** | When a task splits into clean fixes and one contentious one, commit and push everything that passes, then file the rest as its own task. Never hold finished green work hostage to a sibling in doubt, and never jam the doubtful one in to keep the set whole. |
| **"It breaks everything" is the one stop condition** | If the rest cannot go green without a decision, commit what is green, leave the tree working, and escalate. |

### Escalate rather than guess

Widen a scope yourself with `amend_task` `{ project, id, scope: [<folder>] }` whenever you can. Otherwise
stop and ask.

**Every escalation carries four parts:** what you expected, what the build did, what still does not hold,
then 2-4 options. Give the run that proves the third part, and put the recommendation first. Each row below
adds one more thing to that shape.

| Stop when | It also carries |
| --- | --- |
| a task no longer serves the roadmap | the flow change as a graph |
| a fix fails twice after a real diagnosis | both diagnoses, and the second fix |
| the graph and the code disagree | the graph's claim beside the code that answers it |
| a done-condition needs a scope you cannot widen yourself | the folder you need, and why widening it is not yours |

Print the recap under it. Nothing merges on an escalation. Then ring the doorbell, because the graph cannot
show a stop:

```text
tasks MCP: notify { project, note: "escalation on <id> - pane <name>" }
```

### The graph has drained

**1. Drain discovered work, then hand over green.** Call `sync` `{ project }`, then `list_ready`
`{ project }` - sync first so the ready set reflects the latest issues. While it returns tasks,
build them as another layer. Only `discovered_from` tasks may drain; an original in `list_ready` means its
commit never closed it. Confirm green from the watcher before review; QA does not re-run the suite.

**2. Review the build, at the level PLAN set.** The level is the **strongest `qa`** among the tasks this
build drained (default `subagent`), read from the schedule. It is PLAN's call, so a build never downgrades
its own review.

| `qa` | You do |
|---|---|
| `subagent` | Dispatch `outputty:outputty-reviewer` at `model: opus`, with the charter's `effort: xhigh`, `run_in_background: false`. Brief it from the template below. |
| `inline` | Load `${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md` and follow it on your own diff, no subagent. |
| `skip` | No reviewer. Follow qa's `skip` bullet in `${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md`, then go to **Merge**. |

Every layer write-up says _expected, not run_.

**At `subagent`, write the brief from this template - WHAT to judge, nothing about HOW to read.**

```text
Load ${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md whole. It is your charter for this run.
LEVEL: subagent
PROJECT: <repo root, the argument every tasks MCP call takes>

Master QA for <target or task ids>, branch stack <bottom>..<top> (PRs #<n>-#<n>).
You are on <branch> in <checkout path>.

SETTLED: <the rulings from the trail that constrain the build, one line each>
DEFERRED: <what was ruled out of scope, so you do not report it as missing>

THE REAL RUN: <the exact command> - expect <the stated counts or output>.
PER-TASK OUTPUT: <each task's done-condition or proof command, one per line - QA prelaunches these>

JUDGE: <the specific questions this build raises, numbered>
```

| Verdict | You do |
|---|---|
| `skip`, so no verdict | `CHECKS` green plus that one run is the pass - go to **Merge** and run it |
| `pass` | go to **Merge** (below) and run it |
| `fail` · salvage | `add_task` its tasks, build them, run master QA again |
| `fail` · rewrite | **escalate** - a rewrite needs new requirements, and requirements are gated |
| `fail` twice | **escalate**, whatever it recommends |

### While you build

**No memory is written during a build.** Lessons are collected once, at the merge retrospective. Never gate
a commit on a clean `git status`; scope the `git add` instead.

## Merge - one sitting, on a `pass` verdict or a skipped review

Reached once: after master QA passes, or straight from a `skip` level, which produces no verdict to block
the merge. First turn each review comment into a task (`add_task`
`{ project, id, title, discovered_from }`) and run another layer; repeat until the PR is clean.

1. **Distill the trail into the product docs**, each decision to its one home. A new feature, knob or
   limitation gets a row in `architecture.md`'s feature index, plus its own section in the machinery or
   seams. Reconcile with `sync`, close stragglers, prune stale prose, and run any `✅` behaviour you
   document.

   **Do not write a status into `roadmap.md`.** Progress is derived, so closing your tasks already moved
   the target - call `roadmap` `{ project }` to see. Touch the file only if the **why** changed. Closing
   the *target* is the orchestrator's call: it can ship with work deliberately deferred.
2. **Record the cycle's pivots in `lessons.md`** - one bold-title-led entry per abandoned or reversed
   approach, each naming its trail. A bug fix or a successful retry earns none.
3. **Bring every other doc in line** - the README and `docs/` (use the `documentation` skill for the
   README). Delete documentation that has no reader. Say what you cut, one line each.
4. **Retrospect.** Persist only what speeds the next cycle: distil, route, prune. Route the durable lesson
   to auto-memory. Mint a skill only for a proven, reusable, multi-step procedure (invoke
   `anthropic-skills:skill-creator`); most cycles mint none.
5. **Summarise the cycle for the user**. Give one base program, then a
   numbered case per capability, each titled by the user's problem. Each case shows `Before:` and now, in
   real observed output.
6. **Finalize the PR.** Re-read the original ask, confirm the branch does exactly that and no more, run
   `CHECKS` on the final state. Write the body to the format in
   `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`.
7. **Green-gate the merge.** ⚠ Close each task **before** the merge, never after. Commit and push the merge
   artifacts to the **top** branch; nothing merges uncommitted. Mark every PR ready (`gh pr ready <n>`) and
   land the stack atomically:

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```
