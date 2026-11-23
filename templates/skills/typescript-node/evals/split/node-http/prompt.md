---
name: split-node-http
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
---

```ts
import { createServer } from "node:http";

const handler = async (request: Request) => new Response(JSON.stringify({ ok: true }));

createServer(async (req, res) => {
  return handler(new Request(`http://localhost${req.url}`, { method: req.method }));
}).listen(3000);
```

`curl localhost:3000` hangs and never gets a response. What's wrong?
