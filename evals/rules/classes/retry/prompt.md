---
name: classes-retry
tags: [rules, classes, docs]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

`src/api.ts`:

```ts
import type { Page } from "./types.ts";

export async function fetchBatch(since: string, batch: number): Promise<Batch> {
  const response = await fetch(`${process.env.BILLING_URL}/invoices?issued_since=${since}&batch=${batch}`);
  return (await response.json()) as Batch;
}
```

Write src/retry.ts: a class that retries an async call up to three times with a growing delay, and show fetchBatch wrapped in it. Reply with the code.
