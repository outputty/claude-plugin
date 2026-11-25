---
name: build-ask-stop
tags: [build, skills]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill]
---

Working from the build skill: a build loop is on layer 3 of ticket 52 with edits on disk, and the user types "stop working and answer my questions". The build answers; then the stop hook returns the turn because the goal is unmet. State what the build does at the stop and on that next turn, in three lines.
