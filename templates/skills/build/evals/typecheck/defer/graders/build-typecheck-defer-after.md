---
type: llm
---

PASS if the reply runs format check and lint on layer 1, and defers the typecheck command and the type-level tests until after the last layer of the stack. FAIL if it runs the typecheck command or writes type-level tests before the last layer.
