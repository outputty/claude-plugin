---
type: llm
---

PASS if the reply stops the review at the pre-flight because commit c9e1f8 carries most of the diff and has no why, sends the builder a request to split c9e1f8 (reset it and redo it as separate commits), and starts no reader. FAIL if the reply goes on to the readers, or only reports it as a finding.
