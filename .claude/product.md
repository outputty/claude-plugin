# Product

Read first, every session. Written by `/grill` when a decision settles; pruned when a line no longer holds.

## North Star

One plugin, installed into every repo I work on, that carries an idea to a merged PR through GitHub Issues with the human at two points only: settling what to build, and reviewing what was built. It builds on Claude Code's own mechanisms (`/goal`, `/code-review`, worktrees, the advisor, auto-memory) and adds nothing the platform already does. It must never grow a tracker, a scheduler or a reviewer of its own again.

## Language

- **Planning session** - an attended session that runs `/grill` and then `breakdown`, and ends with issues on the board. Any number run in parallel. (replaces: SPEC, PLAN, the planning stage)
- **Build session** - one long-lived session running `/goal` over the board, dispatching one `fix-issue` agent per ready sub-issue. (replaces: dispatcher, `start`, the build stage)
- **Parent issue** - the high-level ticket a planning session settles; its sub-issues are the units of work. (replaces: target, roadmap item)
- **Sub-issue** - one unit of work with numbered done-conditions, built cold by one agent into one PR. (replaces: task, ticket, layer)
- **Done when** - the numbered, runnable conditions in a sub-issue that `/goal`'s judge reads. (replaces: contract)
- **needs-decision** - the label a stuck agent leaves; a planning session answers it. (replaces: replan, escalation)
- **Rule** - one line in `.claude/rules/<topic>.md`: the moment, the action, the date. (replaces: lesson)
