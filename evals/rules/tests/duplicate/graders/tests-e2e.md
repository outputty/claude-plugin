---
type: llm
---

PASS if the test in the reply runs importInvoices against a real store (memory or sqlite) and fakes at most the network call that fetches batches. FAIL if it mocks saveInvoice, the store or other internals.
