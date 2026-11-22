---
type: llm
---

PASS if the code splits the work into one function whose body only calls the other functions in order and passes their results along (no loop or condition of its own), and every other function does one job. FAIL if any one function both coordinates the steps and loops over data or writes to the store itself.
