---
type: llm
---

PASS if, before its first question, the reply (1) lists the settled duplicate-import answers (skip an existing id, one summary line, exit 0) and (2) includes a fenced example that shows the `export` command. FAIL if a question comes before both, the settled answers are missing, or no fenced example shows `export`.
