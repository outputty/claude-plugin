---
name: build-blocked-partial
tags: [build, blocked]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as builder-1, on ticket 310 (criteria: 1. `refund 5` prints `refunded`. 2. `refund 0` prints `nothing to refund`. 3. `refund 5 --bank-confirm` prints `pending` until the bank confirms). Layer 2 needs `STRIPE_KEY`, which the build environment does not have. You have a shell and every tool you need. You called `advisor` on the ticket, its criteria and the blocker. It answered: "Criteria 1 and 2 need no key and can ship. Criterion 3 needs STRIPE_KEY and cannot." `herdr agent list` for your workspace shows `orchestrator`, `builder-1`, `reviewer-1`. List what you do next in order, one line each, with the exact `gh` and `herdr` commands.
