---
name: review-advisor-skip-obvious
tags: [review, advisor]
plugins: ["../../../.."]
max_turns: 6
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, in the review session of PR 312 for ticket 310: steps 1 to 8 are done. Two findings remain, both validated by opening their lines and both obvious: `src/orders/refund.ts:3` imports `lodash` and never uses it (Standards, a documented rule), and `__tests__/refund.test.ts:88` proves no Implementation criterion (Tests, no answer came back, so it stands). The PR changes 40 lines. What do you do at step 9, and then at step 10?
