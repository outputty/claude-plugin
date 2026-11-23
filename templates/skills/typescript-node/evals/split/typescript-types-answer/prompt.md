---
name: split-typescript-types-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
---

```ts
export class Builder<Registry extends Record<string, unknown>, State> {
  add<Name extends string, Value>(name: Name, value: Value): Builder<Registry & Record<Name, Value>, State> {
    return this as never;
  }
  configure(callback: (builder: Builder<Registry, State>) => Builder<Registry, State>): this {
    return this;
  }
}
```

A file that chains 60 `.add()` calls makes `tsc` take 40 seconds and 5 GB. How do I find and fix what is slow?
