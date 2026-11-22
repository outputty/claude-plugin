---
name: names-monthly
tags: [rules, names, docs]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

Add src/report.ts with a function that totals invoice amounts per month, and print the totals in `ledger status`.
