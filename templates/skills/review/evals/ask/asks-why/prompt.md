---
name: review-ask-asks-why
tags: [review, ask]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, as reviewer-1, in the review of PR 312 for ticket 310. The build agent is `builder-1`. The pinned head is `a1b2c3d`. The ticket asks for `refund 5` to print `refunded`. The Provenance reader returned one finding: `src/util/money.ts:9` adds a new helper `formatMoney`, while `src/lib/money.ts:12` already exports `formatCurrency`, which does the same job and is on `origin/main`. The finding is validated; step 7 is next. Give the exact shell command you run.
