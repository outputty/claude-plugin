---
name: build-charter-no-new-pattern
tags: [build, charter]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as builder-1, on ticket 310, whose criteria need one new early return in `src/orders/refund.ts:30`. You are thinking of adding a `RefundStrategy` interface with three implementations, so the key source can be swapped later, and `src/orders/cart.ts:12` already exports `refundAmount`. Say what you build, and whether you call `advisor` first.
