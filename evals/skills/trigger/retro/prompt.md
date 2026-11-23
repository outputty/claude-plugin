---
name: trigger-retro
tags: [skills]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
---

The build skill ran migrations on every import again. We should never do that during an import; make this a rule.
