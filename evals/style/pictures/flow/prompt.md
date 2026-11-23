---
name: pictures-flow
tags: [pictures]
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

`src/lock.ts`:

```ts
import { openSync, closeSync, unlinkSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

export class LockTimeout extends Error {}

export async function withLock<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const deadline = Date.now() + 10_000;
  let fd: number | undefined;
  while (fd === undefined) {
    try {
      fd = openSync(path, "wx");
    } catch {
      if (Date.now() > deadline) throw new LockTimeout(path);
      await sleep(200);
    }
  }
  try {
    return await fn();
  } finally {
    closeSync(fd);
    unlinkSync(path);
  }
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

Walk me through what happens when `ledger import` runs.
