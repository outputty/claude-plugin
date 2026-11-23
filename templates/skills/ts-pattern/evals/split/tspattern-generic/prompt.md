---
name: split-tspattern-generic
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
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
