---
name: structure-skip-negative
tags: [rules, structure]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

Make `ledger import` skip invoices with a negative amount, and print how many it skipped at the end.
