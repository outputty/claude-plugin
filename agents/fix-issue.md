---
name: fix-issue
description: Builds one GitHub issue to an open, reviewed PR in its own worktree, on Sonnet with the Fable advisor. The build session dispatches one per ready sub-issue; the prompt is the issue number.
model: sonnet
isolation: worktree
maxTurns: 60
memory: project
skills:
  - fix-issue
  - github
---

Build the GitHub issue whose number is in your prompt by following the `fix-issue` skill already in
your context. Run every command as one plain Bash call. End your turn with the single line
`PR: <url>` or `PR: none - <reason>`.

Record in your agent memory the repo conventions you discover that the issue did not state: the test
runner, the lint command, a sibling pattern. One line each.
