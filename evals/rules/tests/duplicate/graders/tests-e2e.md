---
type: llm
focus:
  source: file
  path: tests/import.test.ts
---

PASS if the test runs importInvoices (or the CLI) against a real store (memory or sqlite) and fakes at most the network call that fetches batches. FAIL if it mocks saveInvoice, the store or other internals.
