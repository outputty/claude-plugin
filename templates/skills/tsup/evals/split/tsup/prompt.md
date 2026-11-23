---
name: split-tsup
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
---

```ts
// tsup.config.ts
import { defineConfig } from "tsup";
export default defineConfig({ entry: ["src/index.ts", "src/worker.ts"], format: ["esm"], dts: true });
```

```ts
// src/errors.ts
export class PipelineError extends Error {}
```

Both entries import `PipelineError`. After the build, `error instanceof PipelineError` is false in `index.js` for an error thrown by `worker.js`. Why?
