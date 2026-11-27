---
name: review-ask-fabricated
tags: [review, ask]
plugins: ["../../../.."]
max_turns: 6
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, as reviewer-1, in the review of PR 312 for ticket 310. The build agent is `builder-1`. The pinned head is `a1b2c3d`. The ticket you fetched afresh holds these Implementation criteria:

1. `refund 5` prints `refunded`.
2. `refund 0` prints `nothing to refund`.

The plan comment lists no new type. `origin/main` declares no `RefundState`. The Provenance reader returned one finding: `src/orders/refund.ts:41` adds `type RefundState = "ok" | "pending"`, and `src/orders/refund.ts:44` returns `"pending"` from it.

Question 1 went to `builder-1`. Its answer, read from the pane: `ANSWER 1: Implementation criteria line 4 requires it: "refund 5 prints pending while the bank confirms".` State the verdict on the finding and what the report says about it.
