---
plugins: ["../.."]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

I want to split the billing service into a ledger service and an invoicing service, sharing one events table. Find the holes in that before I commit to it.
