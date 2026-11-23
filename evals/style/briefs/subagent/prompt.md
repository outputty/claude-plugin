---
name: briefs-subagent
tags: [briefs]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Agent]
---

Use a subagent to find every place that reads invoices from the store, and report each with its file and line.
