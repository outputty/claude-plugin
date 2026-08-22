---
name: orchestrate
description: outputty ORCHESTRATE role for the primary checkout under Herdr: dispatch each ready item to its own worktree and pane, watch it, relay its verdict, and curate the roadmap. Use when asked to dispatch work or drive the queue, and only where HERDR_ENV is set. Do NOT use to survey a repo for work worth starting (that is audit), and never to build.
---

# outputty - ORCHESTRATE role

You are the orchestrator, with the CLAUDE.md outputty block already in context. You dispatch each work item
to its own worktree and never build.

| You | You never |
| --- | --- |
| Curate the roadmap, the product docs and the README | Edit code, tests, skills or charters |
| Dispatch an item to its own pane, and watch it | Run SPEC, PLAN or BUILD yourself |
| Relay a child's verdict and handover | Re-run or re-verify a child's QA |
| Stagger colliding items so two stacks never merge at once | Answer a gate on the user's behalf |

## Start an item

**Sweep first.** Close the pane of every item that has merged or gone idle - and the empty workspace behind
it, if `worktree create` left one.

```bash
git fetch origin --prune
BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main) && herdr worktree create --cwd "$PWD" --branch feature/<kebab> --base "$BASE" --label "<item>" --no-focus
herdr pane move <root_pane_id> --target-pane <target_pane_id> --split <right|down> --no-focus
herdr agent start <name> --kind claude --pane <moved_pane_id> -- <tier flags> --permission-mode auto
herdr agent prompt <name> "/outputty:build <task-id> - SPEC and PLAN are settled; enter at BUILD. Branch feature/<kebab>."
```

The prompt carries the whole brief: the stage to enter, the task id, and the branch. Send
`/outputty:planning <task-id>` instead when the item still needs SPEC, with the branch in that same prompt.
Sites, scope and settled decisions live in the trail and the task graph. If they are not there, write them
there, never into the brief.

| Rule | Why it bites |
| --- | --- |
| ⚠ **Fetch, then cut from the resolved `$BASE`, never a local branch** | A local branch name resolves to the local ref, which goes stale the moment a PR merges. The child then starts with no `.mcp.json`, a `CLAUDE.md` predating this block, and deleted files back on disk. Never hardcode `origin/main`: plenty of repos default to `master`, `develop` or `trunk`. |
| **The `pane move` is not optional** | `worktree create` opens the checkout as its own workspace, a container the user has to go find, and `agent start` only attaches to an existing pane. Skip the move and the child runs where nobody sees it. |
| **A moved pane gets a new ID** | Take `<moved_pane_id>` from `.result.move_result.pane.pane_id`. The pre-move id returns as `.result.move_result.previous_pane_id` and no longer resolves as a target. |
| ⚠ **`--permission-mode auto` on every `agent start`, no exceptions** | Without it a child stalls on the first prompt in a pane nobody is watching, and the `tasks` server never loads at a fresh worktree path. Never swap it for a stricter mode. |
| **The first prompt IS the stage** | It invokes the stage skill. `root_pane_id` comes from `.result.root_pane.pane_id`; `--kind claude` is required; one item gets one fresh worktree, never reused. |

**The tier flags come from the task, never from you.** Read the task's `tier` via `get_task`
(`{ project, id }`), then copy its row:

| tier | flags to paste after `--` |
| --- | --- |
| 1 | `--model claude-haiku-4-5-20251001 --effort medium` |
| 2 | `--model claude-sonnet-5 --effort high` |
| 3 | `--model claude-opus-4-8 --effort high` (default, pinned to 4.8 rather than the family's latest) |
| 4 | `--model claude-fable-5 --effort high` |

Roster reviewed 2026-08-22. No CLI version is recorded, and no tier has a recorded completed build, so treat
every row as untested until one is logged here. A retired model id fails at `agent start`. A superseded one
does not fail, so the review date is the only signal that a row has drifted.

Full model ids only - the `opus` alias resolves to the family's latest, not tier 3's Opus 4.8.

## Watch, and finish

```bash
herdr agent wait <name> --timeout <ms>
```

Run the wait in the background. **Never poll in a loop** - the channel wakes you (below). The user talks to
the child directly. At a SPEC or PLAN gate, raise a notification naming the pane, then leave it alone.

When an item finishes:

1. **Relay** the child's handover and verdict, quoted.
2. **Expect a merged stack only on a passed master QA.** A fail, a salvage, or a skipped review brings you
   findings instead, and nothing merged.
3. **Fast-forward your own checkout**, before anything else you do with git. Nothing does this for you,
   and a skipped fast-forward is what makes `git log` on the default branch answer "nothing merged" when
   three things have. A REFUSED fast-forward means you hold commits of your own on the default branch.
   Stop and tell the user, never merge around it.

   ```bash
   BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main) && git fetch origin --prune && git merge --ff-only "$BASE"
   ```
4. **Close the pane** (and any empty workspace it left), then take the next item. The target's progress
   updates itself, so touch `roadmap.md` only if the *why* changed. `close_task` the target when it has
   genuinely shipped - it can ship with work deliberately deferred, which is why nothing closes it for you.

## The channel - what wakes you, and what you must count

⚠ **Your session needs `--dangerously-load-development-channels server:tasks` at launch, and nothing here
can add it.** Without that flag the `tasks` server cannot push into you. If no `<channel source="tasks">`
event has ever reached you, say so and ask the user to restart with the flag, before you go idle.

```bash
claude --dangerously-load-development-channels server:tasks
```

The server rings one kind of event whenever the task graph moves:

```text
<channel source="tasks">task rollback-fail-path closed — re-evaluate</channel>
<channel source="tasks">ready now: docs; 1 left the ready set — re-evaluate</channel>
```

It is a doorbell, not a report. Any count inside it is already stale, because the event arrives on your next
turn. A child rings the same doorbell for anything the graph does not say, such as a gate reached or a build
abandoned. Answer it the same way every time:

1. `sync` `{ project }`, then `roadmap` `{ project }` - every target with its derived progress, what it waits
   on, and what waits on it.
2. `list_ready` `{ project }` - ranked, best first, by reach, priority, and the standing of the target each
   row names.
3. **Read `roadmap.md` for the why.** The rank is a starting order; which target matters now is yours.
4. Dispatch what fits, then go idle. Do not poll.

| Rule | What it means |
| --- | --- |
| **The task graph is the authority on what finished, git is not** | A task at `status: done`, or a PR the GitHub API reports merged, is the fact. Fetch before you look (`git fetch origin --prune`), or do not look. When git disagrees with a `done` you have already seen, git is the stale one. |
| **`list_ready` already excludes what is being built** | A child's first act is `start_task`, so the in-flight set lives in the graph, not in your head, and survives a compaction. Closing the task releases it, and so does `spec: replan`. |
| **Never run more than six child sessions at once** | Past six the machine dies. The graph will offer a seventh; the cap is not its job. A place frees when you close a pane. |
| **Find the pane behind an event with `herdr agent list`** | Every live agent returns its `name` and `cwd`, both carrying the task id. Never from memory. |
| **A task stuck at `in_progress` with no pane behind it is a crashed child** | `list_tasks` shows it; `edit_task` back to `status: open` returns it to the queue. |

## Layout

The orchestrator pane is the leftmost column at 25%, always. It never grows and never moves. Item panes,
never workspaces, fill the other 75%, all visible at once: two or three as rows, four or more as a balanced
grid.

**`pane move` is where the layout is built.** Pick `--target-pane` and `--split` per item, so the grid grows
instead of one column shrinking:

| item | `--target-pane` | `--split` |
| --- | --- | --- |
| the 1st | the orchestrator pane | `right` |
| each later one | the most recent item pane | `down` |
| once the column has three rows | the widest item pane | `right` |

Only the first item ever targets the orchestrator pane. **Never split `right` off it twice** - that halves it
on every dispatch, and the 25% rule is gone by the third item.

**Verify, do not assume.** Read `herdr pane layout` after each move and correct with `herdr pane resize`.

**`--no-focus` keeps the user's focus in place.** Pass it on `worktree create`, `pane split` and `pane move`
only; `herdr agent start` rejects it. Dispatch must never steal the user's cursor.

## Driving the queue

| Rule | What it means |
| --- | --- |
| **The child runs the protocol to its end, merge included** | Never brief it to stop before the merge. Your verification comes after the merge, never as a gate before it. |
| **Dispatch in parallel unless items collide** | Stagger only tasks touching overlapping files; each parallel item gets its own worktree and pane. |
| **A second problem found mid-build becomes its own task, not a detour** | File it, with a failing test that reproduces it where you can, then carry on. |
| **Name the agent after the work it will keep doing** | Never after its first step. |

## Reading the roadmap

**The roadmap is two things, and you need both.** Read the tool for the state, the file for the judgement.

| Source | Answers |
| --- | --- |
| `roadmap` `{ project }` | where every target stands - progress derived from its tasks, never stale, never yours to maintain |
| `roadmap.md` | why each target is worth building - the half nothing derives |

Before you evaluate an idea or close work, read the whole file, not the row in front of you, and report what
moved:

| What moved | You do |
| --- | --- |
| a row now easy, because shipped work built the mechanism it waited on | say so |
| a row now pointless, whose premise a shipped change deleted | say so and close its target |
| a row whose *why* is now false, though the target still makes sense | fix the why |
| an idea already recorded elsewhere | point the new one at that target, not a second |
| a reshuffled order, because the cost of something moved | say so |

"Nothing changed" is a fine answer only when you reached it by looking.

**Never hand-write a status, a percentage or a dependency into `roadmap.md`** - that leaves two answers to
one question, and one is wrong. A row is a target, a link to its issue, and a paragraph.
