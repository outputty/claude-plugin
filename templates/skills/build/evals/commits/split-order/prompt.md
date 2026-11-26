---
name: build-commits-split-order
tags: [build, commits]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as shop-builder-1, with PR 312 open and shop-reviewer-1 reviewing it. You have a shell. A message from shop-reviewer-1 reads: "Split c9e1f8. Reset it and redo it as separate commits." Commit c9e1f8 holds a cleanup of cart.ts and the new refund branch together. Say what you do, in order, with the exact commands that touch git or Herdr.
