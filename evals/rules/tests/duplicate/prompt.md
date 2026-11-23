---
name: tests-duplicate
tags: [rules, tests]
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

`src/store/memory.ts`:

```ts
import type { Invoice } from "../types.ts";
import type { Store } from "./store.ts";

export class MemoryStore implements Store {
  private invoices: Invoice[] = [];

  async insert(invoice: Invoice): Promise<void> {
    this.invoices.push(invoice);
  }

  async all(): Promise<Invoice[]> {
    return [...this.invoices];
  }

  async count(): Promise<number> {
    return this.invoices.length;
  }

  async exec(): Promise<void> {}
}
```

`src/store/store.ts`:

```ts
import type { Invoice } from "../types.ts";

export interface Store {
  insert(invoice: Invoice): Promise<void>;
  all(): Promise<Invoice[]>;
  count(): Promise<number>;
  exec(sql: string): Promise<void>;
}
```

`src/types.ts`:

```ts
export type Invoice = { id: string; amount: number; issuedAt: string };
export type Batch = { invoices: Invoice[]; next: number | null };
```

Write tests/import.test.ts with node:test that proves importing the same invoice twice keeps one row. Reply with the file.
