# Roadmap

Why each open ticket is worth building, and now. Status lives on the GitHub board, not here. `/plan` adds a paragraph when it files a ticket; the docs layer moves it under Shipped.

## Next

- **First real run** - one ticket through `/plan` → `/tickets` → `/goal` → `/build` in this repo. It settles the unverified points: `gh stack init` then `gh stack add` from a `--worktree` session, the advisor firing on a Sonnet session, and the `/goal` judge reading the pasted Done when outputs.

## Later

- **A `Ready for review` board column** - the built-in automations only know `Done` on merge; a fourth column needs an option added in the GitHub UI and one more `item-edit` in `build`.
- **Whole-stack review** - `/code-review` runs per layer; a review of the ticket's stack as one diff is a `claude ultrareview <base>` once the stack is complete.

## Killed

- **A task server of the plugin's own (`tasks-mcp`)** - GitHub Issues, sub-issues and `--blocked-by` cover the graph; the ranking, overlap and heartbeat it added were never what blocked a build (audit of 25 sessions, 2026-08-28).
- **A dispatch ledger and per-target stacks** - `/goal` over the board plus one agent per sub-issue; the ledger's one real job, catching a dead child, is the 90-minute assignee release.
- **Sub-issues as the unit of work** - the granular graph was tried and disliked; one ticket carries the end state, the build agent chooses its own layers, and `--blocked-by` keeps the order between tickets (2026-08-28).
- **`/goal` as a queue condition** - "no ticket left" is not a goal anyone holds; a goal is one ticket, typed by the user (2026-08-28).
- **A dispatch loop of any kind** (`/loop` over `loop.md`, a build agent per ticket) - too much to explain and to hold in one head; the user picks the ticket by hand from `/tickets` and starts the session (2026-08-28).
- **An expert-panel grill** - the Fable advisor answers the judgement calls a panel was dispatched for; the experts' knowledge itself is not lost: `init` turns each domain into a skill under `.claude/skills/<domain>/`, merging the near-duplicates (2026-08-28).

## Shipped

- **#182-#186 Simplification** - the plugin rebuilt on built-ins: six skills, one agent, templates; the tasks server, dispatch loop, builder charter and 20k lines of prose retired.
