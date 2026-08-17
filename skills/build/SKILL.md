---
name: build
description: outputty BUILD stage — build a settled task hands-off, one stacked PR per layer, one master QA after the graph drains, then merge. The orchestrator dispatches this as a child session's first prompt (/outputty:build <id>); a session told to build invokes it before anything else. Assumes the CLAUDE.md outputty block is already in context.
---

# outputty — BUILD stage

**You are a BUILD session.** Your task's requirements are already settled. You build it unattended,
and you never stop to ask a question - see the replan exit below.

## Your steps

1. **BUILD** - the section below. You build every layer yourself. One layer, one PR, stacked.
2. **MASTER QA**, once, after the graph drains. The build's only real run.
3. **Merge** - a cold-path reference, read once on a `pass` verdict.

**Read the task's `attempts` before choosing an approach.** If this task has been through a replan, each
entry names a road already closed.

## The replan exit - the only way a build stops early

**A requirements gap is not a question. It is a replan.** The moment you cannot proceed without a ruling
nobody has made, stop. Do not guess, do not pick the interpretation that looks cheapest, and do not sit
waiting in a pane nobody is watching.

1. **Scratch what you built** on that gap. Never leave half-built work against a wrong requirement.
2. **Append an `attempts` entry**: what you tried, what killed it, and the file:line or run that proves
   it. `tried` and `killed_by` are both required.
3. **Set `spec: replan`** and report. The task leaves your stage and the planning stage picks it up.

Write that entry for a reader who was not here.

**Escalate rather than replan only when the blocker is not a requirements gap.** A broken environment,
a missing credential, or a dependency that does not exist all qualify. Planning cannot answer those.

**Under Herdr you never close your own workspace or dispatch a sibling session.** You run this item to
its merge and report. The orchestrator closes the workspace afterwards.

**Needs** a git repo, a GitHub remote, authenticated `gh`, and `gh extension install github/gh-stack`.
There is no single-PR fallback.

## BUILD - you build it, one gate at the end

You build every layer yourself. There is no build agent and no per-layer QA. One whole-build review runs
after the graph drains, and that is the only review.

**The driver is your early warning, not a reviewer.** Add a check whenever you add a surface.

### Before the first layer

1. **Compact the session.** Once, here, and not per layer. Start with room.
2. **Green baseline, and capture `CHECKS`.** Run the repo's own test, build and lint. A red baseline
   means stop and surface it. **The repo owns how its tests run**, so read its `CLAUDE.md`, README or
   manifest scripts and take the commands from there. Never prescribe a runner.
3. **Start the suite in watch mode, in the background** — your green signal. Confirm green by **reading
   the watcher**, never by re-running the whole suite. Without watch mode, say so once and run `CHECKS`.
   A **docs-only** ticket touches no code, so it needs no watcher — skip this.
4. **Derive the layers.** Call the `tasks` MCP tool `schedule` with `{ project }` (the repo root). It
   rejects cycles and unmet deps. Every task op below is a `tasks` MCP tool taking `{ project }`.
5. **Allowlist what the build runs** so nothing stalls on a prompt: `CHECKS`, `git`, `git push`, `gh`.
   The `tasks` MCP tools need no allowlist.

### The layer loop

Per layer, in order.

**1. Is this still the right work?** Query `roadmap` and this branch's trail. Read them now, not from
memory of PLAN. Four questions:

- Which roadmap item does it still serve?
- Does the `contract` match the seams as they now stand?
- Has some of it already happened?
- Can you state "done" in one sentence?

| Verdict | You do |
| --- | --- |
| still right | build it |
| right work, stale words | `amend_task` `{ project, id, brief }`, then build. Say what you changed. |
| already done | `close_task` `{ project, id }`, one line in the recap naming what did it |
| no longer serves the roadmap | **escalate - that is a product decision, not yours** |

**2. Resolve any `hitl` task first.** A `mode: hitl` task needs the user. Ask, fold the answer into the
brief, then build.

**3. Build it.** Test-first: turn each task's `contract` into a failing test, then write the laziest diff
that passes it. Apply the code rules (`${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md`); they govern
this diff.

**4. Prove it green.** With the watcher running, **read its latest result** for the red-to-green
transition — do not re-run the whole suite. Without a watcher, run `CHECKS`. Never infer green. **A
docs/config-only layer changed no code**, so skip this step — nothing to test. The merge gate still runs
the full suite once on the final state.

**5. Commit, stack, publish.** Cut `feature/<x>-l<N>` off the previous layer's branch **before** you
commit. Per task, call **`close_task` `{ project, id }` FIRST, then a scoped `git add`** of the task's
files. The close ships inside the layer that did the work, not after it (it closes the task's GitHub
issue). Write the PR body in the format
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` enforces.

```bash
git checkout -b feature/<x>-l<N>               # off the previous layer's branch, not off main
# … commit stage runs here …
gh stack add feature/<x>-l<N>                  # first layer instead: gh stack init <branch> <branch>
gh stack submit --auto                          # push + open/update the PRs as drafts
gh pr edit <n> --title "<the write-up's heading>" --body-file <the layer's write-up>
```

**Set the title explicitly.** The title is the write-up's `## <what this layer did>` heading.

**Two flags are hands-off traps.** `gh stack init` with **no arguments demands interactive input**, so
always pass the branch names, which you already have from `schedule`. And `gh stack submit` **opens an
editor** unless you pass **`--auto`**. With `--auto`, new PRs are created as **drafts**.

**Name layers with a hyphen, never a slash.** Git rejects `feature/<x>/l1` once `feature/<x>` exists as
a branch. A rebase conflict between layers is an **escalation**, and is never force-resolved inside a
hands-off build.

**6. Print the recap.** Cumulative.

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

**Every deferred issue names the task it became.** **Name work, never a bare id**:
`Drain the barrel re-exports` (`t-31`).

### Escalate rather than guess

Stop and ask in these cases:

- a task no longer serves the roadmap
- a fix fails twice after a real diagnosis
- the graph and the code disagree
- a done-condition needs a scope you cannot widen yourself

Widen a scope yourself with `amend_task` `{ project, id, scope: [<folder>] }` whenever you can.

**Shape:**

- the flow change as a graph
- the expected outcome
- what you attempted
- what still fails, with evidence
- 2-4 options, recommendation first

Print the recap under it. Nothing merges on an escalation.

### The graph has drained

**1. Drain discovered work, then hand over green.** Call `list_ready` `{ project }`. While it returns
tasks, build them as another layer. Only `discovered_from` tasks may drain. An original in `list_ready`
means its commit never closed it. Confirm green from the watcher before review; QA does not re-run the
suite.

**2. Review the build, at the level PLAN set.** The level is the **strongest `qa`** among the tasks this
build drained (default `subagent`), read from the schedule. It is PLAN's call, so a build never
downgrades its own review.

| `qa` | You do |
|---|---|
| `subagent` | Dispatch `outputty:outputty-reviewer` at **opus/xhigh**, `run_in_background: false`, with a prompt telling it to load the `qa` skill — an independent read-only reviewer, the build's one real run. |
| `inline` | Load the `qa` skill (`${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md`) and review your own diff here, no subagent. For small, low-risk work only. |
| `skip` | `CHECKS` green is the review. Run the target program once, then stop. Trivial mechanical work only. |

Every layer write-up says _expected, not run_. Nothing blocks a merge that skipped review, and the merge
step assumes its verdict.

**At `subagent`, write the brief from this template — WHAT to judge, nothing about HOW to read.**

```text
Master QA for <roadmap row or task ids>, branch stack <bottom>..<top> (PRs #<n>-#<n>).
You are on <branch> in <checkout path>.

SETTLED: <the rulings from the trail that constrain the build, one line each>
DEFERRED: <what was ruled out of scope, so you do not report it as missing>

THE REAL RUN: <the exact command> — expect <the stated counts or output>.
PER-TASK OUTPUT: <each task's done-condition or proof command, one per line — QA prelaunches these>

JUDGE: <the specific questions this build raises, numbered>
```

⚠ **A brief never tells the reviewer how to read.** The `qa` skill owns that: the full diff first,
files whole only on demand.

| Verdict | You do |
|---|---|
| `pass` | read `${CLAUDE_PLUGIN_ROOT}/skills/build/references/merge-step.md` and run it |
| `fail` · salvage | `add_task` its tasks, build them, run master QA again |
| `fail` · rewrite | **escalate** - a rewrite needs new requirements, and requirements are gated |
| `fail` twice | **escalate**, whatever it recommends |

**Making it work is not always the cheap option.** Ask three questions. Can you say in one sentence what
the code is _for_? Did a fix contradict an earlier fix? Does holding it together need a special case per
call site? A restart inherits everything learned. Extend the task list with what master QA surfaced.
Prune what the build proved unnecessary. Carry the code that earned its place as snippets in the briefs.
Record the abandoned approach in `lessons.yaml`.

### While you build

**Delegate a hunt, not a lookup.** `Read` a known file whole. Dispatch the `scout` skill on
`outputty-reviewer`, foreground and read-only, when an answer needs more than a couple of lookups. Batch
open questions into one run.

**No memory is written during a build.** Lessons are collected once, at the merge retrospective. Never
gate a commit on a clean `git status`, and scope the `git add` instead.

## Merge step — cold path, in a reference

The merge step is one sitting, reached exactly once, on a `pass` verdict. It covers the trail distilled
into the product docs, lessons, the docs sweep, the retrospective, the version bump, and the atomic `gh
stack merge`. It lives in its own file so it does not ride every layer:

**On `pass`, read `${CLAUDE_PLUGIN_ROOT}/skills/build/references/merge-step.md` and run it.**
