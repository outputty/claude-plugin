---
name: review-simplicity-smaller
tags: [review, simplicity]
plugins: ["../../../.."]
max_turns: 6
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, as reviewer-1, in the review of PR 312 for ticket 310. The ticket's Implementation criteria are: 1. `refund 5` prints `refunded`. 2. `refund 0` prints `nothing to refund`. The diff adds `src/orders/refundEngine.ts` (+212): a `RefundStrategy` interface with three implementations and a factory, used once from `src/orders/refund.ts:30`. `origin/main` has `src/orders/refund.ts:30`, a function that returns early for a zero amount, and `src/orders/legacyRefund.ts` (64 lines), which the new code replaces and leaves uncalled. State the Simplicity finding as it goes in the report.
