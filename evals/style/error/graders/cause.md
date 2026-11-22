---
type: llm
---

PASS if the reply says the cause is that saveInvoice calls store.insert, a plain INSERT, so an invoice whose id is already stored (from an earlier run, or repeated by the API) violates the primary key. FAIL if it names another cause.
