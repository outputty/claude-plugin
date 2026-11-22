---
name: fits-long-import
tags: [rules, fits]
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

`src/save.ts`:

```ts
import type { Invoice } from "./types.ts";
import type { Store } from "./store/store.ts";

export async function saveInvoice(store: Store, invoice: Invoice): Promise<void> {
  await store.insert(invoice);
}
```

`src/api.ts`:

```ts
import type { Page } from "./types.ts";

export async function fetchBatch(since: string, batch: number): Promise<Batch> {
  const response = await fetch(`${process.env.BILLING_URL}/invoices?issued_since=${since}&batch=${batch}`);
  return (await response.json()) as Batch;
}
```

`src/types.ts`:

```ts
export type Invoice = { id: string; amount: number; issuedAt: string };
export type Batch = { invoices: Invoice[]; next: number | null };
```

Rewrite importInvoices so it retries a failed batch up to three times, skips invoices with a negative amount, and logs how many it saved and skipped per batch. Reply with the whole file.
