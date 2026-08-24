---
name: start
description: outputty's dispatch loop - take a lane, wave-dispatch each ready ticket to its own unattended background build agent, hold on a one-minute tick, and re-dispatch when the wave drains. Use when asked to start work, drive the queue or dispatch a lane. Use `audit` to survey a repo for work worth starting, and `build` to build a ticket.
---

# outputty - the dispatch loop

You are the one attended session. You dispatch, and you relay.

Input: a lane, or every lane. Output: merged stacks, one per ticket, and a drain report.

Three moves belong elsewhere:

1. **Build, edit or commit** - dispatch a child.
2. **A child's QA** - relay the verdict it returned.
3. **A completion wake** - relay, and let a tick with zero workers dispatch.

## Take the lane

A **lane** is a folder subtree you may build in. Disjoint lanes are what keep two dispatchers off each
other's files, so keep yours disjoint.

The lane comes from the invocation (`/outputty:start skills`). With none, ask - you are attended, so
this is the one skill in the flow that may use `AskUserQuestion`:

1. **One lane**, named as folders.
2. **Everything**, when nothing else is running.

Then read `roadmap.md` whole. The rank is a starting order; which target matters now is yours.

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

An empty `list_ready` routes to **The queue is dry** below. Otherwise take rows from the top until
the cap. Then, per row, in order:

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
   contract and settled decisions live in the ticket and the trail, where the child reads them.
4. **A spike ticket** (`tags` contains `spike`) is briefed to draft a ticket. Add:
   `The deliverable is a drafted ticket via add_task, plus a trail note. Nothing merges.`
5. **Three at once, at most.** The machine died at seven, and each child also runs the repo's test suite
   in watch mode. Three is also the ceiling at which a human can still read what came back.

**A ticket is claimed by the child, not by you.** `start_task` is the build's own first call.

## The queue is dry - offer planning

`list_ready` came back empty with no build worker running, so the bottleneck is upstream. Read
`list_planning` `{ project }`. Empty too → print the drain report and stop. Otherwise turn the wait
into a choice, in three moves:

1. **Rank what planning holds**: `priority` first, then the targets' `roadmap.md` order.
2. **Offer the top four with `AskUserQuestion`**, `multiSelect: true` - the task id as each option's
   label, its title and target as the description. The tool shows those four labels and little else,
   so the full ranked list goes in the drain report, where "Other" reaches it.
3. **Dispatch one planning child per selected id**, and name each child so the user knows where its
   conversation lives:

```text
Agent { subagent_type: "general-purpose", isolation: "worktree", run_in_background: true,
        prompt: "/outputty:planning <id> - the user answers your gates in this chat, never
                 the dispatcher's. AskUserQuestion does not reach them: ask in prose. To
                 wait on an answer, end your turn on a message opening `AWAITING:` with the
                 round - your session persists, and the reply resumes you where you stopped.
                 Open your report with `HANDOFF:` once every task is settled. You are in
                 your own worktree, cut from the default branch; branch and PR from there." }
```

**A planning child's stop is a wait, never an exit.** Its session persists, and the user's next
message in its chat resumes it. Route each of its notifications by the first line:

1. **`AWAITING:`** - tell the user, in one line, which chat waits on them, and nothing else. The
   answers belong in that chat; a repeat stop from the same child relays nothing new.
2. **`HANDOFF:`** - the chat settled its specs, and the next tick's `list_ready` carries them. Note
   it under the drain report's **Planning** section.

**A planning child is not a build worker.** It claims no ticket and no folders. Keep the `/loop 1m`
tick running: each spec the chats settle drops into `list_ready`. A tick that finds rows with zero
build workers dispatches the wave, guard first.

## Hold, and re-dispatch

Invoke `/loop 1m` with the tick prompt, and keep it running for the whole session. The loop is your
fallback heartbeat; a child finishing wakes you on its own.

**Each tick, in order:**

1. **Count the build workers still going.** A planning child chats and does not count. If any build
   worker runs, the tick is a no-op - do nothing else, and mark it so. A forty-minute build costs
   forty silent ticks, collapsed into one line.
2. **Zero build workers, so the wave has drained.** Relay any verdict you have not yet, fast-forward,
   sweep, re-read, dispatch the next wave.
3. **Drained, with planning chats still open** - hold. Their settled specs are the next wave.
4. **Drained, with nothing in planning and nothing blocked on another lane** - stop the loop, and
   print the drain report.

**On a child-completion wake mid-wave**: relay that child's verdict, fast-forward if it merged, and wait.
Dispatch belongs to a tick that found zero workers.

⚠ **A wave moves at the speed of its slowest child.** A five-minute child waits for its forty-minute
sibling. That is the trade. Dispatch always runs against an empty in-flight set, so a row's `overlap`
is only ever checked against other lanes.

### What a drained tick does, in order

1. **Relay** each child's handover and verdict, quoted. A `pass` means the stack merged. A fail or a
   salvage brings findings instead, and nothing merged.
2. **Fast-forward your own checkout.** Nothing does this for you.

   ```bash
   BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
   git fetch origin --prune && git merge --ff-only "$BASE"
   ```

   A refused fast-forward means you hold commits of your own on the default branch. Stop and tell the
   user, who decides what happens to them.
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

**Planning** - the ranked queue, when tasks wait there

1. `csv-export-v2` - `AWAITING:` your answers, in its own chat
2. `analyst-self-serve` - waiting, priority high

**Roadmap**

1. `analyst-self-serve` - now easy: `csv-export` shipped the export seam it waited on
```

**Read `roadmap.md` whole before you write that last section**, and report what moved:

1. **A row now easy, because shipped work built the mechanism it waited on** - say so.
2. **A row now pointless, whose premise a shipped change deleted** - say so, and close its target.
3. **A row whose *why* is now false, though the target still makes sense** - fix the why.
4. **An idea already recorded elsewhere** - point the new one at that same target.
5. **A reshuffled order, because the cost of something moved** - say so.

"Nothing changed" is a fine answer only when you reached it by looking. Touch the file only when the
*why* changed.

## What this loop does not cover

1. **The loop dies with this session; its children do not.** Closing the terminal orphans whatever is
   running. That is why staleness lives in the tasks server: the next dispatcher sees the claim go
   quiet and releases it.
2. **A child cannot ask you anything.** `AskUserQuestion` is stripped from every subagent, so a build
   that meets a requirements gap replans instead of guessing. A planning child interviews the user in
   its own chat, in prose. A gap that keeps recurring is a ticket authoring problem, not a dispatch
   problem.
3. **A permission prompt from a child surfaces here.** You are attended, so answer it. A repeat means
   the allowlist is short; the fix is an `allow` entry in the committed `.claude/settings.json`, which
   every later worktree inherits.
4. **Cross-lane unblocks are yours.** When your lane drains while another lane still runs, the tick
   that finds nothing ready is the one that notices work freed elsewhere.
