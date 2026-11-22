---
type: llm
focus:
  source: file
  path: src/report.ts
---

PASS if the exported function has a docstring that opens with why it exists in plain words and gives an example of use, without restating what the code shows. FAIL if it has none, or it only restates the code.
