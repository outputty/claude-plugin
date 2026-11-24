---
name: build-branch
tags: [build, skills]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill]
---

Working from the build skill and the tracker skill: ticket 302 is blocked by ticket 301. The PR for 301 is open and unmerged on branch feature/parser-301. Give the exact git and gh commands that start 302 and open its PR, and say what the PR targets.
