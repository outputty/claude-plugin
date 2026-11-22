# Product

Read first, every session. Written by `/outputty:plan` when a decision settles; pruned when a line no longer holds.

## North Star

One plugin, its skills, standing lines and output style supplied to every session and its rules copied once under `~/.claude/`, that carries an idea to a merged PR through the repo's tracker with the human at these points only: settling what to build, choosing which ticket to build next, and reviewing what was built. A **fast-path fix** folds the choosing into the planning session itself: when a spike is already the complete fix, one `AskUserQuestion` still lets the human choose whether it ships now or waits for a separate build. It builds on Claude Code's own mechanisms (`/goal`, `/code-review`, worktrees, the advisor, auto-memory) and adds nothing the platform already does. It must never grow a tracker, a scheduler, a dispatcher or a build reviewer of its own again: tickets live in the repo's tracker, through the `tracker` skill.
