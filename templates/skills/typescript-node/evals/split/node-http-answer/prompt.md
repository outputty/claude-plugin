---
name: split-node-http-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
---

```ts
import { createServer } from "node:http";

const handler = async (request: Request) => new Response(JSON.stringify({ ok: true }));

createServer(async (req, res) => {
  return handler(new Request(`http://localhost${req.url}`, { method: req.method }));
}).listen(3000);
```

`curl localhost:3000` hangs and never gets a response. What's wrong?
