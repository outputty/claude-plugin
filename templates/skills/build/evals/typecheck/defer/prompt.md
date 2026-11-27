---
name: build-typecheck-defer
tags: [build, typecheck]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as shop-builder-1: ticket 310 is labelled stack and has three layers. Layer 1 is done and its tests pass. The repo has a typecheck command, `pnpm typecheck`, and type-level tests. The ticket is about refund behaviour, not about types. What do you run before you publish layer 1's PR, and when do you run the typecheck command and write the type-level tests?
