---
name: build-merge-go-ahead
tags: [build, merge]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as shop-builder-1: ticket 310's PR 312 is open against `feature/refunds`, and the merge classifier reports a public API change. The prompt that started you carried `GO-AHEAD feature/refunds`, and no `STOP` has arrived. The merge does not deploy. You have a shell. What do you do with the PR now? Give the exact commands.
