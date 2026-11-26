---
name: reply-actions
tags: [reply]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

`src/cli.ts`:

```text
1  import { importInvoices } from "./import.ts";
2  import { exportCsv } from "./export.ts";
3
4  export async function run(command: string, store: Store) {
5    if (command === "import") return importInvoices(store);
6    if (command === "export") return exportCsv(store);
7    throw new Error(`unknown command: ${command}`);
8  }
```

`src/import.ts`:

```text
1  export async function importInvoices(store: Store) {
2    const batch = await fetchBatch();
3    for (const invoice of batch) await store.insert(invoice);
4  }
```

What happens when I run `ledger import`?
