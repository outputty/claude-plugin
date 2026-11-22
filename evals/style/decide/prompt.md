---
tags: [style]
plugins: ["../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep]
---

import lock - how is it implemented? Do we have a general lock? Do we use the store for locks? Does it make sense to have a distinct locking module?
