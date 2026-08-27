---
name: retro
description: Turns this session's corrections and rework into rules, each written to the one file that loads it next time. Use at the end of a planning session, before a build session ends, or on "retro", "lesson", "what should we remember".
---

# retro - a correction becomes a rule

Read the session as one thing and answer four questions:

1. Where did the user correct you?
2. Where did you build something, then scrap it?
3. Where did you ask something that was already written down?
4. Where did a claim you carried turn out false?

Each hit is a candidate. Keep it only if it would change a rule; one-off friction and a bug a commit
closed are not lessons. Grep `.claude/rules/` and auto-memory first: a pattern already there gets its
line sharpened, not a second line.

Route each survivor to one home:

1. **This project** - one line in the matching `.claude/rules/<topic>.md`: the moment, the action,
   the date. `- After a rename, git grep prose for the old name before the commit. (2026-08-28)`
2. **Any repository** - auto-memory, `type: feedback`, with **Why** and **How to apply**.
3. **A fixed moment** ("always run X after Y") - a hook in `.claude/settings.json`, not prose.
4. **A dead end** - one line under **What was tried before** in the PR body, so it is not retried.

Commit the rule change on the current branch. Writing nothing is a real outcome: say so.
