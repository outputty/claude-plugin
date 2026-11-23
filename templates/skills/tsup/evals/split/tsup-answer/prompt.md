---
name: split-tsup-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
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
