---
name: classes-json-store
tags: [rules, classes, docs]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

Add a store that keeps invoices in a JSON file, in src/store/json.ts, next to the sqlite and memory stores.
