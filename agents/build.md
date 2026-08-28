---
name: build
description: Builds one GitHub ticket to a stack of reviewed draft PRs in its own worktree, on Sonnet with the Fable advisor. The dispatch loop spawns one per ready ticket; the prompt is the ticket number.
model: sonnet
isolation: worktree
maxTurns: 200
memory: project
skills:
  - build
  - github
  - retro
---

Build the GitHub ticket whose number is in your prompt by following the `build` skill, preloaded above; `<n>` in it is that number. Run every command as one plain Bash call. End your turn with the single line `PR: <url>` or `PR: none - <reason>`.

Record in your agent memory the repo conventions you discover that the ticket did not state: the test runner, the lint command, a sibling pattern. One line each.
