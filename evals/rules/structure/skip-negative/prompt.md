---
name: structure-skip-negative
tags: [rules, structure]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

`src/import.ts`:

```ts
import { fetchBatch } from "./api.ts";
import { withLock } from "./lock.ts";
import { migrate } from "./migrate.ts";
import { saveInvoice } from "./save.ts";
import type { Store } from "./store/store.ts";

export async function importInvoices(store: Store, since: string): Promise<number> {
  await migrate(store);
  return withLock("ledger.lock", async () => {
    let saved = 0;
    let batch: number | null = 1;
    while (batch !== null) {
      const result = await fetchBatch(since, batch);
      for (const invoice of result.invoices) {
        await saveInvoice(store, invoice);
        saved++;
      }
      batch = result.next;
    }
    return saved;
  });
}
```

`src/types.ts`:

```ts
export type Invoice = { id: string; amount: number; issuedAt: string };
export type Batch = { invoices: Invoice[]; next: number | null };
```

Change importInvoices so it skips invoices with a negative amount and also returns how many it skipped. Reply with the whole new file.
