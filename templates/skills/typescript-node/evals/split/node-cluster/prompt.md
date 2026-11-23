---
name: split-node-cluster
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
---

```ts
import cluster from "node:cluster";
import { availableParallelism } from "node:os";

if (cluster.isPrimary) {
  for (let i = 0; i < availableParallelism(); i++) cluster.fork();
  let done = 0;
  cluster.on("message", () => {
    if (++done === availableParallelism()) console.log("all done");
  });
} else {
  process.send!("done");
}
```

It prints "all done", then the script never exits. Why?
