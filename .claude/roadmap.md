# Roadmap

Why each open ticket is worth building, and now. Status lives on the board, not here. `/plan` adds a paragraph when it files a ticket; the docs layer moves it under Shipped.

## Next

- **First real run** - one ticket through `/plan` → `/tickets` → `/goal` → `/build` in this repo, on the repo's own copy of the skills. It settles the unverified points: `init` copying the scaffold into a fresh repo, the stack commands from a `--worktree` session, the advisor firing on a Sonnet session, and the `/goal` judge reading the pasted Done when outputs.
- **A non-GitHub tracker** - one repo on Linear rewrites `tracker/SKILL.md` under the contract's headings; nothing else should change. Waits on a repo that uses one.

## Later

- **A `Ready for review` board column** - the shipped GitHub tracker knows `Todo`, `In Progress`, `Done`; a fourth column needs an option added on the board and one more move in `build`.
- **Whole-stack review** - `/code-review` runs per layer; a review of the ticket's stack as one diff is a `claude ultrareview <base>` once the stack is complete.

## Killed

- **A task server of the scaffold's own (`tasks-mcp`)** - the repo's tracker, dependencies between tickets and labels cover the graph; the ranking, overlap and heartbeat it added were never what blocked a build (audit of 25 sessions, 2026-08-28).
- **A dispatch ledger and per-target stacks** - one ticket, one session, one stack; the ledger's one real job, catching a dead child, is gone with the children.
- **Sub-issues as the unit of work** - the granular graph was tried and disliked; one ticket carries the end state, the build chooses its own layers, and dependencies keep the order between tickets (2026-08-28).
- **`/goal` as a queue condition** - "no ticket left" is not a goal anyone holds; a goal is one ticket, typed by the user (2026-08-28).
- **A dispatch loop of any kind** (`/loop` over `loop.md`, a build agent per ticket) - too much to explain and to hold in one head; the user picks the ticket by hand from `/tickets` and starts the session (2026-08-28).
- **An expert-panel grill** - the Fable advisor answers the judgement calls a panel was dispatched for; the experts' knowledge is kept as one skill per domain under `.claude/skills/<domain>/` (2026-08-28).
- **A globally installed plugin as the product** - a repo on another tracker could not adapt it; the plugin is now one command that copies the scaffold into the repo, and the repo owns its copy (2026-08-28).

## Shipped

- **#182-#203 Rebuilt as a scaffold** - the tasks server, dispatch loop, builder charter, expert agents and 20k lines of prose retired; five skills, the output style, three rules files, four product docs and two templates copied into the repo by `/outputty:init`, with the tracker as the repo's own skill.
