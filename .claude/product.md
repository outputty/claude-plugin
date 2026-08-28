# Product

Read first, every session. Written by `/grill` when a decision settles; pruned when a line no longer holds.

## North Star

One plugin, installed into every repo I work on, that carries an idea to a merged PR through GitHub Issues with the human at two points only: settling what to build, and reviewing what was built. It builds on Claude Code's own mechanisms (`/loop`, `/code-review`, worktrees, the advisor, auto-memory) and adds nothing the platform already does. It must never grow a tracker, a scheduler or a reviewer of its own again.

## Language

- **Planning session** - an attended session that runs `/grill` and ends with one ticket on the board. Any number run in parallel. (replaces: SPEC, PLAN, the planning stage, breakdown)
- **Loop session** - one long-lived session running `/loop` over `.claude/loop.md`, spawning one `build` agent per ready ticket. (replaces: dispatcher, `start`, build session)
- **Ticket** - one roadmap item: the interface agreed in planning, the end state as Done when cases, and what it is blocked by. Built by one agent into one stack. (replaces: target, parent issue, sub-issue, task)
- **Layer** - one PR in a ticket's stack, chosen by the build agent so the program works after each merge; the last layer is docs. (replaces: sub-issue as a unit of work)
- **Done when** - the numbered, runnable end-state cases in a ticket; the build runs every one before it ends. (replaces: contract)
- **needs-decision** - the label a stuck agent leaves; a planning session answers it. (replaces: replan, escalation)
- **Rule** - one line in `.claude/rules/<topic>.md`: the moment, the action, the date. (replaces: lesson)
