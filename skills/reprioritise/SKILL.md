---
name: reprioritise
description: Reorders the queue so the next dispatch takes the work that matters now - by task and target priority, and by deps. Use when the user asks to reprioritise, reorder or reshuffle the queue, to bump work up, or to push it down. Runs standalone, or inside a planning session that meets work which should come first.
---

# reprioritise - reorder the queue

Input: the queue as it stands. Output: a queue whose top row is the work to do next, and one trail
note per row you moved.

**You are attended, and the order is the user's.** You recommend with evidence; they decide. This
stage moves work, and it never plans, authors or builds any.

## What sets the order today

Read all three before you propose a move. Each answers something the others cannot.

1. `roadmap` `{ project }` - every target, its tasks counted, and which targets gate which. The
   ranking runs on this: a target waiting on an unshipped target sorts its work below rows that are
   clear.
2. `list_ready` `{ project }` - the ranked queue a dispatcher would take from, top first.
3. `.claude/roadmap.md` - the prose order and the why behind it, which no tool holds.

**Name the gap between the rank and the intent.** A row the user calls urgent that sits fourth is the
finding; the levers below are how you close it.

## The four levers

Pick the weakest one that does the job, and say which you used.

1. **A task's `priority`** - `edit_task` `{ project, id, priority }`, one of `high`, `normal`, `low`.
   This moves one row.
2. **A target's `priority`** - the same call on the target. It multiplies the rank of every task the
   target holds, so it moves a whole block. Reach for this when the user reorders themes rather than
   tickets.
3. **`deps`** - `edit_task` `{ project, id, deps }` on a task, or on a target whose release truly
   waits on another. ⚠ `deps` REPLACES the list, so send the whole one. This is the only lever that
   states a real order rather than a preference, and `schedule` derives the layers from it.
4. **`.claude/roadmap.md`** - the paragraph that says why a target moved. Write it whenever a target
   changes rank, so the next reader inherits the reason rather than the result.

**`priority` back to `normal` clears the label**, because absence is the default. That is how a row
comes back down.

## The loop

1. **Read the three sources**, then state the current top five in one list, each with the target it
   serves and the reason it sits there.
2. **Propose the new order**, as a numbered list of moves. One line per move: the row, the lever, the
   old value, the new value, and what it costs to jump the queue. Recommend first, then wait.
3. **Apply what the user takes**, one `edit_task` per row.
4. **Record each move** with `append_trail` `{ project, id, kind: "decision" }`, naming what it now
   sits above and why. A priority with no recorded why is re-litigated at the next reshuffle.
5. **Re-read `list_ready`** and show the new top five. The proof is the queue, never your intent.

⚠ **A claimed row does not move.** `list_ready` excludes what a worker holds, so a change to it takes
effect at the next free slot, and the running build finishes on the old order. A dispatcher refills the
moment a child returns, so a row you lift now is taken by the next child rather than after the queue
drains.

## What this stage refuses

1. **Reordering by rewriting a `brief` or a `contract`** - that is planning, because it changes the
   work itself. Send it to `/outputty:planning <id>`.
2. **Dropping a row to reorder it** - a row nobody will build is a `close_task` with a reason, taken
   deliberately, never a silent demotion to `low`.
3. **A dependency that is only a preference** - `deps` blocks a build until the dep closes. When the
   order is taste, `priority` carries it.
