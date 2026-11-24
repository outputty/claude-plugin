---
type: llm
---

PASS if the reply says it starts a Haiku agent to read the whole PR diff and report a public API change, possibly breaking functionality and a major refactor, and says the PR waits for the user because the flag rename is a public API change. FAIL if it merges the PR, or merges on its own judgement without a classifier.
