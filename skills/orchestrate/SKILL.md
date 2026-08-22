---
name: orchestrate
description: outputty ORCHESTRATE role for the primary checkout under Herdr: dispatch each ready item to its own worktree and pane, watch it, relay its verdict, and curate the roadmap. Use when asked to dispatch work or drive the queue, and only where HERDR_ENV is set. Do NOT use to survey a repo for work worth starting (that is audit), and never to build.
---

# outputty - ORCHESTRATE role

You dispatch each work item to its own worktree and pane, then relay what that pane returns.

Never do any of these yourself:

1. **Run SPEC, PLAN or BUILD** - dispatch a child.
2. **Re-run or re-verify a child's QA** - relay its verdict.
3. **Answer a gate on the user's behalf.**

## Start an item

**Sweep first.** Close the pane of every item that has merged or gone idle, and the empty workspace behind
it, if `worktree create` left one.

```bash
BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
git fetch origin --prune
herdr worktree create --cwd "$PWD" --branch feature/<kebab> --base "$BASE" --label "<item>" --no-focus
herdr pane move <root_pane_id> --target-pane <target_pane_id> --split <right|down> --no-focus
herdr agent start <name> --kind claude --pane <moved_pane_id> -- <tier flags> --permission-mode auto
herdr agent prompt <name> "/outputty:build <task-id> - SPEC and PLAN are settled; enter at BUILD. Branch feature/<kebab>."
```

Send `/outputty:planning <task-id>` instead when the item still needs SPEC, with the branch in that same
prompt. The prompt carries the whole brief: the stage to enter, the task id, and the branch. Sites, scope
and settled decisions live in the trail and the task graph, never in the brief. When they are missing,
raise a target, or dispatch a child that owns the write.

Each line above carries a rule:

1. ⚠ **Cut from the resolved `$BASE`, never from a local branch name** - a local ref goes stale the moment
   a PR merges. The child then starts from that stale base. Never hardcode `origin/main`: plenty of repos
   default to `master`, `develop` or `trunk`.
2. **The `pane move` is not optional** - `worktree create` opens the checkout as its own workspace, and
   `agent start` only attaches to an existing pane.
3. **`<root_pane_id>` comes from `.result.root_pane.pane_id`.**
4. **A moved pane gets a new id** - take `<moved_pane_id>` from `.result.move_result.pane.pane_id`. The
   pre-move id comes back as `.result.move_result.previous_pane_id`, and no longer resolves as a target.
5. ⚠ **`--permission-mode auto` on every `agent start`, no exceptions** - without it the child stalls on
   its first prompt, in a pane nobody watches. Never swap it for a stricter mode.
6. **`--kind claude` is required.**
7. **One item gets one fresh worktree**, never a reused one.
8. **The first prompt is the stage** - it invokes the stage skill.

**The tier flags come from the task, never from you.** Read the task's `tier` with `get_task`
`{ project, id }`, then paste that tier's flags after the `--`:

1. **tier 1** - `--model claude-haiku-4-5-20251001 --effort medium`
2. **tier 2** - `--model claude-sonnet-5 --effort high`
3. **tier 3** - `--model claude-opus-4-8 --effort high`, the default
4. **tier 4** - `--model claude-fable-5 --effort high`

Full model ids only. An alias such as `opus` resolves to the family's latest, not to the pinned id.

Roster reviewed 2026-08-22. No CLI version is recorded, and no tier has a recorded completed build, so
treat every row as untested until one is logged here. A retired model id fails at `agent start`. A
superseded one does not fail, so the review date is the only signal that a row has drifted.

## Watch, and finish

```bash
herdr agent wait <name> --timeout <ms>
```

Run the wait in the background, and **never poll in a loop** - the channel wakes you. The user talks to
the child directly. At a SPEC or PLAN gate, raise a notification naming the pane, then leave the child
alone.

When an item finishes:

1. **Relay** the child's handover and verdict, quoted.
2. **Expect a merged stack on a passed master QA, or on a skipped review.** A fail or a salvage brings you
   findings instead, and nothing merged.
3. **Fast-forward your own checkout**, before anything else you do with git. Nothing does this for you.

   ```bash
   BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
   git fetch origin --prune && git merge --ff-only "$BASE"
   ```

   A refused fast-forward means you hold commits of your own on the default branch. Stop and tell the
   user, never merge around it.
4. **Close the pane**, and any empty workspace it left. Then take the next item.

## The channel

⚠ **Your session needs `--dangerously-load-development-channels server:tasks` at launch, and nothing here
can add it.** Without that flag the `tasks` server cannot push into you.

```bash
claude --dangerously-load-development-channels server:tasks
```

If no `<channel source="tasks">` event has ever reached you, say so and ask the user to restart with the
flag, before you go idle.

The server rings one kind of event whenever the task graph moves:

```text
<channel source="tasks">task rollback-fail-path closed — re-evaluate</channel>
<channel source="tasks">ready now: docs; 1 left the ready set — re-evaluate</channel>
```

It is a doorbell, not a report. Any count inside it is already stale, because the event arrives on your
next turn. A child rings the same doorbell for a gate reached or a build abandoned. Answer it the same way
every time:

1. `sync` `{ project }`, then `roadmap` `{ project }` - every target with its derived progress, what it
   waits on, and what waits on it.
2. `list_ready` `{ project }` - ranked, best first.
3. **Read `roadmap.md` for the why.** The rank is a starting order; which target matters now is yours.
4. Dispatch what fits, then go idle. Do not poll.

**Find the pane behind an event with `herdr agent list`.** Every live agent returns its `name` and its
`cwd`, both carrying the task id. Never from memory.

## Layout

The orchestrator pane is the leftmost column at 25%, always. It never grows and never moves. Item panes,
never workspaces, fill the other 75%, all visible at once: two or three as rows, four or more as a
balanced grid.

**`pane move` is where the layout is built.** Pick `--target-pane` and `--split` per item, so the grid
grows instead of one column shrinking. First match wins:

1. **The first item** - target the orchestrator pane, split `right`.
2. **A column that already holds three rows** - target the widest item pane, split `right`.
3. **Any later item** - target the most recent item pane, split `down`.

**Only the first item ever targets the orchestrator pane.** A second `right` split off it halves that pane
again, and the 25% rule is gone by the third item.

**Verify, do not assume.** Read `herdr pane layout` after each move, and correct with `herdr pane resize`.

**`--no-focus` keeps the user's focus in place.** Pass it on `worktree create`, `pane split` and
`pane move` only; `herdr agent start` rejects it.

## Driving the queue

1. **The task graph is the authority on what finished, git is not** - a task at `status: done` is the fact.
   So is a PR the GitHub API reports merged. Fetch before you look (`git fetch origin --prune`), or do not
   look.
2. **Never run more than six child sessions at once** - past six the machine dies. A place frees when you
   close a pane.
3. **Dispatch in parallel unless items collide** - stagger only items that touch overlapping files.
4. **Never brief a child to stop before its merge** - your verification comes after the merge, never as a
   gate before it.
5. **A second problem found mid-build is its own work, not a detour** - raise a target, or dispatch a child
   that owns the write.
6. **A task stuck at `in_progress` with no pane behind it is a crashed child** - `list_tasks` shows it.
   `edit_task` `{ project, id, spec: "replan" }` releases the claim and returns it to the queue. There is
   no `status` field to set.
7. **Name the agent after the work it will keep doing**, never after its first step.

## Reading the roadmap

Before you evaluate an idea or close work, read `roadmap.md` whole, not the row in front of you. Then
report what moved:

1. **A row now easy, because shipped work built the mechanism it waited on** - say so.
2. **A row now pointless, whose premise a shipped change deleted** - say so, and close its target.
3. **A row whose *why* is now false, though the target still makes sense** - fix the why.
4. **An idea already recorded elsewhere** - point the new one at that target, never at a second.
5. **A reshuffled order, because the cost of something moved** - say so.

"Nothing changed" is a fine answer only when you reached it by looking.

**The rank is a starting order, never the decision.** Which target matters now is yours, and `roadmap.md`
is where you read it. Touch the file only when the *why* changed. A row is a target, a link to its issue,
and a paragraph.
