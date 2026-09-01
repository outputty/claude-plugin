# Roadmap

What is built and what is being built towards, in chunks of work. Status lives on the board; the truth about behaviour lives in `product.md`. This is the only doc that names tickets.

## Building

- **First real run** - one ticket through `/plan` → `/tickets` → `/goal` → `/build` in this repo, on the repo's own copy of the skills. It settles the unverified points: `init` copying the scaffold into a fresh repo, the stack commands from a `--worktree` session, the advisor firing on a Sonnet session, and the `/goal` judge reading the pasted Done when outputs.

## Later

- **A non-GitHub tracker** - one repo on Linear rewrites `tracker/SKILL.md` under the contract's headings; nothing else should change. Waits on a repo that uses one.
- **A `Ready for review` board column** - the shipped GitHub tracker knows `Todo`, `In Progress`, `Done`; a fourth column needs an option added on the board and one more move in `build`.
- **Whole-stack review** - `/code-review` runs per layer; a review of the ticket's stack as one diff is a `claude ultrareview <base>` once the stack is complete.

## Built

- **Docs contract v2 and build discipline** (PRs #215-#222) - the test layer with expected-fail e2e cases, Conventional Commits in the output style, prescriptive instruction files, five docs with `product.md` as the product's truth, Language in `CLAUDE.md`, `lessons.md` fed by every retro.
- **Rebuilt as a scaffold** (#182-#203) - the tasks server, dispatch loop, builder charter, expert agents and 20k lines of prose retired; the flow skills, the output style, the rules, the product docs and two templates copied into the repo by `/outputty:init`, with the tracker as the repo's own skill.

## Killed

- **A task server of the scaffold's own (`tasks-mcp`)** - the repo's tracker, dependencies between tickets and labels cover the graph; the ranking, overlap and heartbeat it added were never what blocked a build (audit of 25 sessions, 2026-08-28).
- **A dispatch ledger and per-target stacks** - one ticket, one session, one stack; the ledger's one real job, catching a dead child, is gone with the children.
- **Sub-issues as the unit of work** - the granular graph was tried and disliked; one ticket carries the end state, the build chooses its own layers, and dependencies keep the order between tickets (2026-08-28).
- **`/goal` as a queue condition** - "no ticket left" is not a goal anyone holds; a goal is one ticket, typed by the user (2026-08-28).
- **A dispatch loop of any kind** (`/loop` over `loop.md`, a build agent per ticket) - too much to explain and to hold in one head; the user picks the ticket by hand from `/tickets` and starts the session (2026-08-28).
- **An expert-panel grill** - the Fable advisor answers the judgement calls a panel was dispatched for; the experts' knowledge is kept as one skill per domain (2026-08-28).
- **A globally installed plugin as the product** - a repo on another tracker could not adapt it; the plugin is now one command that copies the scaffold into the repo, and the repo owns its copy (2026-08-28).
