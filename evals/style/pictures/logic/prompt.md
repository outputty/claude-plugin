---
name: pictures-logic
tags: [pictures]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

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

How does withLock decide whether to wait, retry or give up?
