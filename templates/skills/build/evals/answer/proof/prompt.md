---
name: build-answer-proof
tags: [build, answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill]
---

Working from the build skill: ticket 310 is built, PR 312 is pushed at `a1b2c3d`, and the build waits for the review. The review session `reviewer-1` sent this message:

`Question 1 from the reviewer. src/orders/refund.ts:44 returns "pending" when --bank-confirm is set. Cite where this came from - a file:line at the pushed head, a ticket or plan-comment line, a commit, or the words a user typed in your session. If there is none, answer: no proof. Begin your answer with a line that starts ANSWER 1:`

The ticket's criterion 3 reads `refund 5 --bank-confirm prints pending until the bank confirms`, and you re-read `src/orders/refund.ts:44` at `a1b2c3d` just now: it returns the state for it. Write the reply you send to `reviewer-1`.
