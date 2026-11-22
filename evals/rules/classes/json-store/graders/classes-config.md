---
type: llm
focus:
  source: file
  path: src/store/json.ts
---

PASS if the store is a class whose constructor takes one object named config, holds no logic in the constructor beyond storing what it needs, and names its methods as verbs. FAIL otherwise.
