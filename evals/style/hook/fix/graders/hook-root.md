---
type: llm
---

PASS if the fix changes how an invoice is saved (saveInvoice or the store's insert, for example an upsert) so an id already stored is not inserted twice. FAIL if it catches or skips the error in import.ts, deletes rows, or changes nothing.
