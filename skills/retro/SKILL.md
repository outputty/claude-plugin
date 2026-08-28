---
name: retro
description: Turns this session's corrections and rework into rules, each written to the one file that loads it next time. Runs at the end of every planning session and inside every build's docs layer, and on "retro", "lesson", "what should we remember".
---

# retro - a correction becomes a rule

Read the session as one thing and answer four questions:

1. Where did the user correct you?
2. Where did you build something, then scrap it?
3. Where did you ask something that was already written down?
4. Where did a claim you carried turn out false?

Each hit is a candidate. Keep it only if it would change a rule; one-off friction and a bug a commit closed are not lessons.

Grep `.claude/rules/` and auto-memory first. A pattern already there gets its line sharpened, not a second line.

## Route each survivor to one home

1. **This project** - one line in the matching `.claude/rules/<topic>.md`: the moment, the action, the date. Add one clause of why, with the run or quote that proved it, only where the action is not obvious from the moment. Example: `- After a rename, git grep prose for the old name before the commit; 13 dead pointers shipped green in #418. (2026-08-28)`
2. **Any repository** - auto-memory, `type: feedback`, with **Why** and **How to apply**. The index stays one line per file.
3. **A fixed moment** ("always run X after Y") - a hook in `.claude/settings.json`, not prose.
4. **A constraint in a dependency** - a line under **Constraints in dependencies** in `.claude/architecture.md`, with the probe that re-verifies it.
5. **A dead end** - one line under **What was tried before** in the PR body. A rejected design also goes under **Killed** in `.claude/roadmap.md`.

Commit the rule change on the current branch. Writing nothing is a real outcome: say so.
