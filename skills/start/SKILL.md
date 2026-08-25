---
name: start
description: outputty's dispatch loop - keep every slot full. Dispatch each ready roadmap target to its own unattended background build agent, refill the slot a returning child frees, and pick up work filed while the loop runs. Use when asked to start work, drive the queue, dispatch a lane, or keep executing tickets as they arrive. Use `audit` to survey a repo for work worth starting, and `planning` to plan one item.
---

# outputty - the dispatch loop

You are the one attended session. You dispatch, and you relay.

Input: the roadmap, narrowed to a lane when the user names one. Output: one merged stack per target,
and a report each time the queue empties.

**The loop runs until the user stops it.** An empty queue is a hold, not an exit: work filed while you
hold is dispatched on the tick that finds it. That is what makes this a queue the user can throw
tickets at.

Three moves belong elsewhere:

1. **Build, edit or commit** - dispatch a child.
2. **A child's QA** - relay the verdict it returned.
3. **Settling a ticket** - `/outputty:planning`, its own session. A row that is not settled is not
   yours to settle, and this loop cannot see it.

## Take the roadmap

**You dispatch roadmap targets, one per child.** A target is self-contained, so its whole task set
ships as one stack and reaches the user as one finished work item.

**A lane is optional.** `/outputty:start skills` narrows you to a folder subtree, for when the user
wants one line of work. With none, every target is in play. Read `roadmap.md` whole either way: the
rank is a starting order, and which target matters now is yours.

**Re-read the graph every time you fill a slot.** The queue changes under you now - a ticket filed
mid-run, a priority moved, a dep shipped by a sibling. A fill that dispatches from a remembered
`roadmap` call dispatches yesterday's ranking.

## Your ledger - the one thing you keep

**One row per live child**: the target id, the folders its open tasks name, and the agent you
dispatched. You add the row at dispatch and drop it the moment that child reports. Nothing else tracks
this, and three questions read straight off it:

1. **How many slots are free** - the cap is three, so free slots are three minus the rows.
2. **Which folders are held** - a candidate target whose folders touch a held set waits its turn.
3. **Which stale claim is dead** - a `stale_claims` row with no ledger row is a child that died.

**A target's folders are the union of `scope` over its open tasks**, not over its ready ones. Call
`list_tasks` `{ project }` once per fill and union the target's open rows.

⚠ **A target's later layers are unclaimed while its child builds layer one**, so the server cannot see
those folders yet - `overlap` reports live claims, and a claim starts when the child reaches that
layer. The ledger is what holds them in the meantime, and it is the reason a fill against live siblings
is safe.

**The ledger is the single truth about free slots.** Both dispatch points below recompute from it, so
a completion wake and a tick can never hand out the same slot twice.

## Fill the free slots

```text
roadmap { project }
```

⚠ **Guard first: you must be on the default branch, current, and clean.** A child's worktree is cut
from your `HEAD`. A checkout that is behind, dirty, or on another branch hands the child the wrong
tree. It fails silently, hours later.

```bash
BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
git fetch origin --prune && git merge --ff-only "$BASE" && git status --porcelain
```

A refused fast-forward, or any output from `status`, stops the fill. Say so, and dispatch nothing. **This
runs before every fill**, not once a session: a sibling that merged half an hour ago moved the branch
you are about to cut from.

**A target is dispatchable when `waitingOn` is empty and `progress.open` is above zero.** A
non-empty `waitingOn` names the targets that must ship first. Rank what is left by `priority`, then
by `roadmap.md`'s order, and take from the top until the ledger is full. Then, per target, in order:

1. ⚠ **Check both overlaps before you dispatch.** They catch different collisions, so run both:

   1. **Your ledger** - this target's open-task folders against every held set. Any intersection means
      a live child of yours will be writing there.
   2. **The server's `overlap`** - `list_ready` `{ project, scope: <lane> }`, read on this target's
      `ready` rows. A non-empty `overlap` is a live claim held outside your ledger, which is another
      dispatcher.

   Either one hits: skip the target, name the claim it collides with, and take the next row.
2. **Claim the target**: `start_task` `{ project, id }`. That is what stops a second dispatcher taking
   the same row, and the child claims each task under it as it builds.
3. **Read the tasks' `tags`.** `spike` changes the brief, and nothing else does.
4. **Dispatch it**, one background agent per target, each in its own worktree, and write its ledger row
   in the same breath:

```text
Agent { subagent_type: "outputty:outputty-builder", run_in_background: true,
        prompt: "Build target <target-id> - its whole task set as one stack. You are in your own
                 worktree, cut from the default branch. Cut your feature branch yourself.
                 Report your handover and verdict." }
```

Each line above carries a rule:

1. ⚠ **`outputty:outputty-builder` on every build dispatch, no exceptions.** Its charter is the BUILD
   stage, and it pins `isolation: worktree`. The child therefore holds every step at startup and never
   edits your checkout. `general-purpose` carries neither, and two children in one working tree
   interleave their commits.
2. **A child's worktree is cut from your own `HEAD`** (`worktree.baseRef: "head"`, which `init` writes).
   The child cuts its own feature branch as its first git act. So the guard above is what makes a
   dispatch correct, and it is not optional.
3. **The prompt carries the target id and the branch instruction, and names no stage.** The charter is
   the stage, and no skill exists to invoke. Scope, contract and settled decisions live in the tickets
   and their trails, where the child reads them.
4. **A spike ticket** (`tags` contains `spike`) is briefed to draft a ticket. Add:
   `The deliverable is a drafted ticket via add_task, plus a trail note. Nothing merges.`
5. **Three live children, at any moment.** The machine died at seven, and each child also runs the repo's
   test suite in watch mode. Three is also the ceiling at which a human can still read what came back.
   ⚠ **Refilling holds the machine at three for as long as the queue lasts**, where waves let it fall to
   zero between them. That sustained load is the price of the loop, and the cap is what bounds it.
6. **Drop the ledger row when the child returns, then act on its target**, in one of three ways:

   1. **Merged, every task closed** - `close_task` `{ project, id }`, which frees the claim.
   2. **Merged, with tasks still open** - work was filed against the target while it built. **Keep the
      claim and dispatch the target again**, into the slot its own child just freed; the new child
      builds what remains as its own stack. Say in the relay which tasks it went back for.
      ⚠ **A re-dispatch that returns with the same open count is a spin** - stop dispatching that
      target and tell the user, because the second child built nothing the first had not.
   3. **Escalated or replanned** - the child left the claim held, and the target is not yours to retry.
      `edit_task` `{ project, id, spec: "replan" }` returns it to the roadmap.

**You claim the target; the child claims each task under it.** Both use `start_task`.

## Hold, and refill

Invoke `/loop 1m` with the tick prompt, and keep it running for the session's whole life. The loop is
your fallback heartbeat and your pickup for newly filed work; a child finishing wakes you on its own.

**Each tick, in order:**

1. **No free slot - the tick is a no-op.** Read your ledger and stop there: no call, no sweep, no
   guard. A claim you have nowhere to dispatch into is not yet your problem. Mark it a no-op, so a
   forty-minute build costs forty silent ticks collapsed into one line.
2. **A free slot - sweep, then fill.** `list_ready` reports the stale claims. **A `stale_claims` row
   with no ledger row of yours is a dead child** - `edit_task` `{ project, id, spec: "replan" }`
   releases it, and its work returns to the queue in time for this same fill. A row that *is* in your
   ledger is your own worker, quiet but alive: leave it alone. ⚠ Freeing a claim under a live worker
   lets a second worker take the same task, and the ledger is the only thing that tells the two apart.
3. **Then fill**, per the section above: guard, re-read, dispatch. A tick that finds a slot but nothing
   eligible is a no-op too.

**On a child-completion wake**: relay that child's verdict, fast-forward, act on its target, then fill
the slot it freed. ⚠ **The wake is a dispatch point.** It is the moment a slot actually frees, and
leaving the fill to the next tick idles a machine you already paid for.

⚠ **A fill runs against live siblings**, which is exactly what waves refused to do. So the folder check
is no longer a formality: skip a target that collides, and take it on a later fill once the holder
returns.

### When a child returns, in order

1. **Relay** its handover and verdict, quoted. A `pass` means the stack merged. A fail or a salvage
   brings findings instead, and nothing merged.
2. **Fast-forward your own checkout.** Nothing does this for you.

   ```bash
   BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
   git fetch origin --prune && git merge --ff-only "$BASE"
   ```

   A refused fast-forward means you hold commits of your own on the default branch. Stop and tell the
   user, who decides what happens to them.
3. **Drop its ledger row, and act on its target** - the three ways under **Fill the free slots**.
4. **Sweep, then fill the slot it freed.**

## The report - printed when the queue empties

**Print it on the first tick where your ledger is empty and nothing is eligible**, then hold. It is a
checkpoint, not an exit: once per idle transition, never once per idle tick.

```markdown
**Lane `skills` - queue empty, holding**

1. `csv-export` - merged, `feature/csv-export` #41-#43 (3 layers, master QA pass) - "<verdict, quoted>"
2. `spike-csv-shape` - spike, drafted `csv-export-v2`, nothing merged

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

**Then keep ticking.** Each idle tick re-reads the roadmap, and a target that has become dispatchable -
a ticket filed, a spec settled, a dep shipped elsewhere - is dispatched on that tick. Say one line when
it happens, so the hold visibly ends.

## What this loop does not cover

1. **The loop dies with this session; its children do not.** Closing the terminal orphans whatever is
   running, and takes the ledger with it. That is why staleness lives in the tasks server: the next
   dispatcher sees the claim go quiet and releases it.
2. **Only settled work is picked up.** A ticket filed but not settled sits in `list_planning`, where
   this loop never looks. Throwing tickets at the queue means throwing *settled* tickets, and
   `/outputty:planning` is what makes one.
3. **A child cannot ask you anything.** `AskUserQuestion` is stripped from every subagent, so a build
   that meets a requirements gap replans instead of guessing. A gap that keeps recurring is a ticket
   authoring problem, not a dispatch problem.
4. **A permission prompt from a child surfaces here.** You are attended, so answer it. A repeat means
   the allowlist is short; the fix is an `allow` entry in the committed `.claude/settings.json`, which
   every later worktree inherits.
5. **Cross-lane unblocks are yours.** When your lane empties while another lane still runs, the idle
   tick is the one that notices work freed elsewhere.
