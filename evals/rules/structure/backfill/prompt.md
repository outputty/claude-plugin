---
name: structure-backfill
tags: [rules, structure, names, docs]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

`src/types.ts`:

```ts
export type Invoice = { id: string; amount: number; issuedAt: string };
export type Batch = { invoices: Invoice[]; next: number | null };
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

`src/save.ts`:

```ts
import type { Invoice } from "./types.ts";
import type { Store } from "./store/store.ts";

export async function saveInvoice(store: Store, invoice: Invoice): Promise<void> {
  await store.insert(invoice);
}
```

Write src/backfill.ts: read invoices from a JSON file, save the ones whose id is not in the store yet, and return how many were saved. Reply with the file.
