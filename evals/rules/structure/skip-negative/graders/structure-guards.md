---
type: llm
focus:
  source: file
  path: src/import.ts
---

PASS if each new condition is a guard clause that returns or continues early, with no else after a return or continue, nesting at most two deep, and no condition joining two checks with && or ||. FAIL otherwise.
