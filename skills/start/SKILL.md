---
name: start
description: outputty's dispatch loop - take a lane, wave-dispatch each ready ticket to its own unattended background build agent, hold on a one-minute tick, and re-dispatch when the wave drains. Use when asked to start work, drive the queue or dispatch a lane. Do NOT use to survey a repo for work worth starting (that is audit), and never to build.
---

# outputty - the dispatch loop

You are the one attended session. You dispatch, you relay, and you never build.

Input: a lane, or every lane. Output: merged stacks, one per ticket, and a drain report.

Never do any of these yourself:

1. **Build, edit or commit** - dispatch a child.
2. **Re-run or re-verify a child's QA** - relay its verdict.
3. **Dispatch on a completion wake** - only a tick with zero workers dispatches.

## Take the lane

A **lane** is a folder subtree you may build in. Two dispatchers with disjoint lanes never write the
same files, which is the only thing keeping two of you off each other's work.

The lane comes from the invocation (`/outputty:start skills`). With none, ask - you are attended, so
this is the one skill in the flow that may use `AskUserQuestion`:

1. **One lane**, named as folders.
2. **Everything**, when nothing else is running.

Then read `roadmap.md` whole. The rank is a starting order; which target matters now is yours.

⚠ **Do not `sync` to start.** It walks every issue, takes minutes, and would stall the loop before it
dispatched anything. The background reconcile keeps the cache current within its
interval. A task a human closed in the meantime is caught downstream, because the build's layer loop
closes work that already happened rather than rebuilding it.

## Dispatch a wave

```text
list_ready { project, scope: <lane> }
```

⚠ **Guard first: you must be on the default branch, current, and clean.** A child's worktree is cut
from your `HEAD`. A checkout that is behind, dirty, or on another branch hands every child of
this wave the wrong tree. It fails silently, hours later.

```bash
BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
git fetch origin --prune && git merge --ff-only "$BASE" && git status --porcelain
```

A refused fast-forward, or any output from `status`, stops the wave. Say so, and dispatch nothing.

Take rows from the top until the cap. Then, per row, in order:

1. ⚠ **Refuse any row whose `overlap` is not empty.** Report it as a mis-drawn lane, naming the claim
   it collides with, and take the next row. Overlap means another live worker already holds those
   folders, so dispatching would put two agents over one file.
2. **Read the row's `tags`.** `spike` changes the brief, and nothing else does.
3. **Dispatch it**, one background agent per ticket, each in its own worktree:

```text
Agent { subagent_type: "general-purpose", isolation: "worktree", run_in_background: true,
        prompt: "/outputty:build <id> - you are in your own worktree, cut from the default branch.
                 Cut your feature branch yourself. Report your handover and verdict." }
```

Each line above carries a rule:

1. ⚠ **`isolation: "worktree"` on every dispatch, no exceptions.** Without it every child edits your
   checkout, and two children in one working tree interleave their commits.
2. **A child's worktree is cut from your own `HEAD`** (`worktree.baseRef: "head"`, which `init` writes).
   The child cuts its own feature branch as its first git act. So the guard below is what makes a
   dispatch correct, and it is not optional.
3. **The prompt carries the whole brief** - the stage, the id, and the branch instruction. Scope,
   contract and settled decisions live in the ticket and the trail, never in the prompt.
4. **A spike ticket** (`tags` contains `spike`) is briefed to draft a ticket, never to merge. Add:
   `The deliverable is a drafted ticket via add_task, plus a trail note. Nothing merges.`
5. **Never more than three at once.** The machine died at seven, and each child also runs the repo's
   test suite in watch mode. Three is also the ceiling at which a human can still read what came back.

**A ticket is claimed by the child, not by you.** `start_task` is the build's own first call.

## Hold, and re-dispatch

Invoke `/loop 1m` with the tick prompt, and keep it running for the whole session. The loop is your
fallback heartbeat; a child finishing wakes you on its own.

**Each tick, in order:**

1. **Count the workers still going. If any are, the tick is a no-op** - do nothing else, and mark it
   so. A forty-minute build costs forty silent ticks, collapsed into one line.
2. **Zero workers, so the wave has drained.** Relay any verdict you have not yet, fast-forward, sweep,
   re-read, dispatch the next wave.
3. **Drained, with nothing blocked on another lane** - stop the loop, and print the drain report.

**On a child-completion wake mid-wave**: relay that child's verdict, and fast-forward if it merged.
**Never dispatch.** Dispatch belongs to a tick that found zero workers, and to nothing else.

⚠ **A wave moves at the speed of its slowest child.** A five-minute child waits for its forty-minute
sibling. That is the trade. Dispatch always runs against an empty in-flight set, so a row's `overlap`
is only ever checked against other lanes, never against your own half-finished wave.

### What a drained tick does, in order

1. **Relay** each child's handover and verdict, quoted. A `pass` means the stack merged. A fail or a
   salvage brings findings instead, and nothing merged.
2. **Fast-forward your own checkout.** Nothing does this for you.

   ```bash
   BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
   git fetch origin --prune && git merge --ff-only "$BASE"
   ```

   A refused fast-forward means you hold commits of your own on the default branch. Stop and tell the
   user, never merge around it.
3. **Sweep the stale claims** `list_ready` reported. A stale claim is a child that died holding a
   ticket. `edit_task` `{ project, id, spec: "replan" }` releases it, and the ticket returns to the
   queue. ⚠ Sweep only on a drained tick. A claim is unambiguously dead only once no worker of yours
   is running.
4. **Re-read**, then dispatch.

## The drain report

```markdown
**Lane `skills` - drained**

1. `csv-export` - merged, `feature/csv-export` #41-#43 (3 layers, master QA pass) - "<verdict, quoted>"
2. `spike-csv-shape` - spike, drafted `csv-export-v2`, nothing merged

**Roadmap**

1. `analyst-self-serve` - now easy: `csv-export` shipped the export seam it waited on
```

**Read `roadmap.md` whole before you write that last section**, and report what moved:

1. **A row now easy, because shipped work built the mechanism it waited on** - say so.
2. **A row now pointless, whose premise a shipped change deleted** - say so, and close its target.
3. **A row whose *why* is now false, though the target still makes sense** - fix the why.
4. **An idea already recorded elsewhere** - point the new one at that target, never at a second.
5. **A reshuffled order, because the cost of something moved** - say so.

"Nothing changed" is a fine answer only when you reached it by looking. Touch the file only when the
*why* changed.

## What this loop does not cover

1. **The loop dies with this session; its children do not.** Closing the terminal orphans whatever is
   running. That is why staleness lives in the tasks server: the next dispatcher sees the claim go
   quiet and releases it.
2. **A child cannot ask you anything.** `AskUserQuestion` is stripped from every subagent, so a build
   that meets a requirements gap replans instead of guessing. A gap that keeps recurring is a ticket
   authoring problem, not a dispatch problem.
3. **A permission prompt from a child surfaces here.** You are attended, so answer it. A repeat means
   the build's allowlist is short, and the fix belongs in `.claude/settings.local.json`.
4. **Cross-lane unblocks are yours.** When your lane drains while another lane still runs, the tick
   that finds nothing ready is the one that notices work freed elsewhere.
