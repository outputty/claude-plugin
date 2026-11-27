---
type: llm
---

PASS if the question sent to the build agent demands a pointer (a file:line, a ticket or plan-comment line, a commit, or words a user typed in its session) and allows the answer `no proof`. FAIL if it only asks why, or asks for an explanation or a justification without a pointer.
