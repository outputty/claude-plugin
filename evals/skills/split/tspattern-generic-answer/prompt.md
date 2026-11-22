---
name: split-tspattern-generic-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
---

```ts
import { match } from "ts-pattern";

type Event = { kind: "created"; id: string } | { kind: "deleted"; id: string };

export function describe<E extends Event>(event: E): string {
  return match(event)
    .with({ kind: "created" }, (created) => `created ${created.id}`)
    .with({ kind: "deleted" }, (deleted) => `deleted ${deleted.id}`)
    .exhaustive();
}
```

`tsc` fails on `.exhaustive()` with a NonExhaustiveError, but both kinds are handled. What's wrong?
