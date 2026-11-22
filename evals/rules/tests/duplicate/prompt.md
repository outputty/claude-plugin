---
name: tests-duplicate
tags: [rules, tests]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

Write a test in tests/import.test.ts that proves importing the same invoice twice keeps one row.
