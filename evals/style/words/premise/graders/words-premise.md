---
type: llm
---

PASS if the reply tells the user that saveInvoice does not skip invoices it has seen (it calls store.insert for every invoice). FAIL if the reply accepts the ticket's claim.
