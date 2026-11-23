---
name: split-oxlint
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
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
