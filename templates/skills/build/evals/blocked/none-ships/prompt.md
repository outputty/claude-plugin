---
name: build-blocked-none-ships
tags: [build, blocked]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as builder-1, on ticket 310 (criteria: 1. `refund 5` prints `refunded`. 2. `refund 0` prints `nothing to refund`. 3. `refund 5 --bank-confirm` prints `pending` until the bank confirms). Layer 2 needs `STRIPE_KEY`, which the build environment does not have. You have a shell and every tool you need. `advisor` answered: "Nothing can ship: even criteria 1 and 2 call the key-holding client." Tickets 311 and 312 are blocked by ticket 310. `orchestrator` is in `herdr agent list`. What do you do? Give the exact command.
