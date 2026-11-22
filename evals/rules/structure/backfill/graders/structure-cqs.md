---
type: llm
---

Ignore the one function that only calls the others in order. PASS if every other function either changes state (writes to the store, mutates an argument, or performs I/O output) and returns nothing (void or Promise<void>), or returns data and changes nothing. FAIL if any of them both changes state and returns a value, such as a count of what it saved.
