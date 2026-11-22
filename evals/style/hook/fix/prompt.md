---
name: hook-fix
tags: [hookbash]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write, Bash]
---

Getting this error when I run import a second time:

```
SqliteError: UNIQUE constraint failed: invoices.id
    at SqliteStore.insert (src/store/sqlite.ts:15:8)
    at saveInvoice (src/save.ts:5:15)
    at importInvoices (src/import.ts:15:15)
```

Fix it.
