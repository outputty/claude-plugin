---
name: reply-why
tags: [reply, close, marks]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

Here is our design note and the export code.

`.claude/docs/design.md`:

```md
# Store redesign

## Store.list()

Every store gains `list({ after, limit })`, which returns one page of invoices sorted by id. `export` will page through invoices with it instead of calling `all()`.

Today `export` calls `all()`, which loads every invoice into memory before writing the first CSV line. On the largest shop account (2.1M invoices) export ran out of memory after 40 s.

`memory` implements `list` by slicing its array; `sqlite` by `WHERE id > ? ORDER BY id LIMIT ?`.
```

`src/export.ts`:

```ts
import type { Store } from "./store/store.ts";

export async function exportCsv(store: Store, write: (line: string) => void): Promise<void> {
  const invoices = await store.all();
  write("id,amount,issued_at");
  for (const invoice of invoices) write(`${invoice.id},${invoice.amount},${invoice.issuedAt}`);
}
```

Why do we need to build list()? What is the use case?
