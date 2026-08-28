One tick of the build loop. Do exactly this, then stop.

1. Fast-forward: `git fetch origin --prune`, then `git merge --ff-only origin/<default branch>`, then `git status --porcelain`. A refused fast-forward or any status output ends the tick with one line saying so; spawn nothing.
2. Release dead agents: a ticket `In Progress` with an assignee and no open PR for over 90 minutes gets `gh issue edit <n> --remove-assignee @me` (commands in the `github` skill).
3. Count live build agents. Fewer than 2: take the next ready ticket per the `github` skill (label `ready`, no assignee, every blocker closed, `priority:high` first, then oldest) and spawn one: `Agent { subagent_type: "build", run_in_background: true, prompt: "<n>" }`. Repeat until 2 are live or nothing is ready.
4. A returned agent's `PR:` line is relayed verbatim; a `PR: none` ticket already carries `needs-decision`.
5. Report one line: `tick: <k> live, spawned #<n>` or `tick: no-op`.
