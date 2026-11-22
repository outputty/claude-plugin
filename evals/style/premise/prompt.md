---
tags: [style]
plugins: ["../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

The ticket says saveInvoice already skips invoices it has seen before, so the duplicate rows must come from the billing API. Add a dedupe step after fetchBatch in import.
