---
name: questions-parked
tags: [questions]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

We are settling two topics on the invoicing CLI: duplicate imports, then the export file name. Duplicate imports is open now.

You asked: "Q1. When an invoice id already exists, should import skip it, overwrite it, or fail?"

My answer: "skip - same as how our billing service treats a failed charge: it skips it and retries every night with a growing delay."

No repo is open; everything is described here. Next question.
