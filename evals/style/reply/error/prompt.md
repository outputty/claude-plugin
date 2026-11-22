---
name: reply-error
tags: [reply, close]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

Getting this error when I run `ledger import` a second time:

```
SqliteError: UNIQUE constraint failed: invoices.id
    at SqliteStore.insert (src/store/sqlite.ts:15:8)
    at saveInvoice (src/save.ts:5:15)
    at importInvoices (src/import.ts:15:15)
```

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

Why?
