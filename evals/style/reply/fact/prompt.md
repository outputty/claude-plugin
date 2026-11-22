---
name: reply-fact
tags: [reply, close]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

`src/cli.ts`:

```ts
import { exportCsv } from "./export.ts";
import { migrate } from "./migrate.ts";
import { SqliteStore } from "./store/sqlite.ts";
import { importInvoices } from "./import.ts";

const store = new SqliteStore(process.env.LEDGER_DB ?? "ledger.db");
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "import":
    console.log(`synced ${await importInvoices(store, args[1] ?? "1970-01-01")} invoices`);
    break;
  case "export":
    await exportCsv(store, (line) => console.log(line));
    break;
  case "migrate":
    await migrate(store);
    break;
  case "status":
    console.log(`${await store.count()} invoices`);
    break;
  default:
    throw new Error(`unknown command: ${command}`);
}
```

What commands does this CLI have?
