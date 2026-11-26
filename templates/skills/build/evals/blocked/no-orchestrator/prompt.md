---
name: build-blocked-no-orchestrator
tags: [build, blocked]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the build skill, as builder-1, on ticket 310 (criteria: 1. `refund 5` prints `refunded`. 2. `refund 0` prints `nothing to refund`. 3. `refund 5 --bank-confirm` prints `pending` until the bank confirms). Layer 2 needs `STRIPE_KEY`, which the build environment does not have. You have a shell and every tool you need. `advisor` answered: "Criteria 1 and 2 can ship; criterion 3 cannot." `herdr agent list` for your workspace shows only `builder-1` and `reviewer-1`: there is no `orchestrator`. Give the exact shell command that tells the orchestrator about the block.
