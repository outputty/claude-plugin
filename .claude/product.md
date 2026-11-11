# Product

Read first, every session. Written by `/plan` when a decision settles; pruned when a line no longer holds.

## North Star

One scaffold, its skills copied into every repo I work on and owned there, its standing lines and output style supplied by the plugin to every session, that carries an idea to a merged PR through the repo's tracker with the human at three points only: settling what to build, choosing which ticket to build next, and reviewing what was built. A **fast-path fix** folds the second touchpoint into the planning session itself: when a spike is already the complete fix, one `AskUserQuestion` still lets the human choose whether it ships now or waits for a separate build. It builds on Claude Code's own mechanisms (`/goal`, `/code-review`, worktrees, the advisor, auto-memory) and adds nothing the platform already does. It must never grow a tracker, a scheduler, a dispatcher or a reviewer of its own again, and it prescribes no tracker: the `tracker` skill is the repo's.

## Language

- **Planning session** - an attended session that runs `/plan` and ends with one ticket on the board, or resumes a ticket labelled `needs-planning`. Any number run in parallel. (replaces: SPEC, PLAN, grill, the planning stage, breakdown)
- **Build session** - a session on its own worktree, started by hand, that builds one ticket under a `/goal` the user types. (replaces: dispatcher, loop session, build agent)
- **Ticket** - one roadmap item: the interface agreed in planning, the end state as Implementation criteria, and what it is blocked by. Built into one PR, or into a stack when labelled `stack`. (replaces: target, parent issue, sub-issue, task)
- **Layer** - one step of a build, chosen by the build session so the program works after each one; the last layer is docs. Commits on the ticket's PR, or its own PR in a stack. (replaces: sub-issue as a unit of work)
- **Stack** - one PR per layer on the planning PR, built only for a ticket the user labelled `stack` at planning; never chosen by size. (no prior term)
- **Implementation criteria** - the runnable end-state cases in a ticket; the build runs every one before it ends, and the `/goal` judge reads them. (replaces: contract, Done when)
- **Scratch file** - a planning session's running record under `~/.claude/projects/<project>/plans/`, outside the repo; a restarted session resumes from it; deleted when the ticket is filed. (replaces: trail)
- **needs-planning** - the label a build leaves when a ticket needs its plan reopened; `/plan <n>` resumes it. (replaces: replan, needs-decision)
- **Check** - what a repeated correction becomes: a lint rule with a probe test, a reproducing test, a hook or permission, a Language line or an output-style line; never a written lesson. (replaces: lesson, rule)
- **Prototype** - a local `prototype/<name>` branch a Haiku session builds from an idea or a ticket: tests first, then only existing patterns, anything new a `TODO: stub`; `/plan` reads it and `/build` continues it. (no prior term)
- **Fast-path fix** - a planning spike that is already the complete fix, built in the planning session on the user's yes. (no prior term)
