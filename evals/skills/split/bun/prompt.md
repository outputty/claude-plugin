---
name: split-bun
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
---

```ts
function declare(name: string, value: unknown) {
  registry.set(name, value);
}

const registry = new Map<string, unknown>();
declare("retries", 3);
console.log(registry.get("retries"));
```

`node --experimental-strip-types run.ts` prints 3. `bun run.ts` prints undefined. Why?
