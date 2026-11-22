---
name: split-oxlint-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
---

```json
{
  "plugins": ["import"],
  "rules": {
    "no-restricted-imports": [
      "error",
      { "patterns": [{ "group": ["node:*"], "message": "No Node builtins in src/core" }] }
    ]
  }
}
```

`.oxlintrc.json` above, and `src/core/read.ts` still has `import { readFileSync } from "fs";` with no lint error. Why does the ban miss it?
