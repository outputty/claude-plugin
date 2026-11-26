---
type: llm
---

PASS if the question sent to `builder-1` asks why `formatMoney` was added when `formatCurrency` already exists, names both with their file:line, and adds no other explanation. FAIL if it omits the existing `formatCurrency`, or explains the reviewer's reasoning, or is long.
