---
name: build-commits-split
tags: [build, commits]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as builder-1: layer 2 of ticket 310 is done and green. It holds two changes in the working tree: a cleanup that removes a duplicate of `refundAmount` from `src/orders/cart.ts` (-52 +38), and the new `refund 5 --bank-confirm` branch in `src/orders/refund.ts` (+24 -3) with its test. How do you commit it? Give the commit titles and messages.
