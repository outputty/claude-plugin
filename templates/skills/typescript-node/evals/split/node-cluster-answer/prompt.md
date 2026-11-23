---
name: split-node-cluster-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
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
