# Roadmap

Why each open parent issue is worth building, and now. Status lives on the GitHub board, not here. `/breakdown` adds a paragraph when it files a parent; a merged parent's paragraph moves under Shipped or is deleted.

## Next

- **First real run** - one ticket through `/grill` → `/loop` → `build` in this repo. It settles the unverified points: `$ARGUMENTS` in a preloaded skill, `gh stack init` then `gh stack add` from an agent worktree, the advisor firing inside a Sonnet subagent, and whether a `/loop` tick can spawn a background agent and see it return on a later tick.

## Later

- **A `Ready for review` board column** - the built-in automations only know `Done` on merge; a fourth column needs an option added in the GitHub UI and one more `item-edit` in `build`.
- **Whole-stack review** - `/code-review` runs per layer; a review of the ticket's stack as one diff is a `claude ultrareview <base>` once the stack is complete.

## Killed

- **A task server of the plugin's own (`tasks-mcp`)** - GitHub Issues, sub-issues and `--blocked-by` cover the graph; the ranking, overlap and heartbeat it added were never what blocked a build (audit of 25 sessions, 2026-08-28).
- **A dispatch ledger and per-target stacks** - `/goal` over the board plus one agent per sub-issue; the ledger's one real job, catching a dead child, is the 90-minute assignee release.
- **Sub-issues as the unit of work** - the granular graph was tried and disliked; one ticket carries the end state, the build agent chooses its own layers, and `--blocked-by` keeps the order between tickets (2026-08-28).
- **`/goal` as the loop's condition** - "no ticket left" is not a goal anyone holds, `/goal` cannot be set by a skill or an agent, and its judge sleeps while agents run; `/loop` over `.claude/loop.md` spawns the agents instead (2026-08-28).
- **An expert-panel grill** - the Fable advisor answers the judgement calls a panel was dispatched for; a researched fact worth keeping goes to auto-memory.

## Shipped

- **#182-#186 Simplification** - the plugin rebuilt on built-ins: six skills, one agent, templates; the tasks server, dispatch loop, builder charter and 20k lines of prose retired.
