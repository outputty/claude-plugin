---
name: names-monthly
tags: [rules, names, docs]
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

Write src/report.ts with an exported function that totals invoice amounts per month, oldest month first. Reply with the file.
