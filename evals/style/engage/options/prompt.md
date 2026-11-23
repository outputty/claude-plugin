---
name: engage-options
tags: [engage, marks, reply]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

`src/save.ts`:

```ts
import type { Invoice } from "./types.ts";
import type { Store } from "./store/store.ts";

export async function saveInvoice(store: Store, invoice: Invoice): Promise<void> {
  await store.insert(invoice);
}
```

`src/store/sqlite.ts`:

```ts
import { DatabaseSync } from "node:sqlite";
import type { Invoice } from "../types.ts";
import type { Store } from "./store.ts";

export class SqliteStore implements Store {
  private db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
  }

  async insert(invoice: Invoice): Promise<void> {
    this.db
      .prepare("INSERT INTO invoices (id, amount, issued_at) VALUES (?, ?, ?)")
      .run(invoice.id, invoice.amount, invoice.issuedAt);
  }

  async all(): Promise<Invoice[]> {
    return this.db.prepare("SELECT id, amount, issued_at AS issuedAt FROM invoices").all() as Invoice[];
  }

  async count(): Promise<number> {
    return (this.db.prepare("SELECT count(*) AS n FROM invoices").get() as { n: number }).n;
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }
}
```

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

A second `ledger import` fails with `UNIQUE constraint failed: invoices.id`. What are our options to fix it? Recommend one.
