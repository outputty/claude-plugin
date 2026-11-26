---
name: build-stale
tags: [build, skills]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill]
---

Working from the build skill: ticket 310's body says `Drafted against: 4f2a9c1` and names `src/import.ts` and `src/save.ts`. Give the exact git command the build runs before its first edit to see what changed in those paths since the ticket was drafted, and say what it does when `src/save.ts` turns out to be gone.
