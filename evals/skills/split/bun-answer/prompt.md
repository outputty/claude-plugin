---
name: split-bun-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
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
