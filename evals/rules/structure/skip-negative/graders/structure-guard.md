---
type: llm
---

PASS if invoices with a negative amount are left out either by a guard clause that continues or returns early, or by a filter step, with no else branch and no try/catch. FAIL if an else branch or a try/catch handles them, or they are not left out.
