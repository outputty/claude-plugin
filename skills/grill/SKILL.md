---
name: grill
description: Grilling session that stress-tests a plan one question at a time — challenges terminology, invents edge-case scenarios, backtracks to surface conflicts, and cross-references against the code. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Adapted from grill-with-docs; outputs go to product.md and the branch trail, not CONTEXT.md/ADRs.
---

<what-to-do>

Interview the user relentlessly about every aspect of the plan until you reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between decisions
one by one. For each question, provide your recommended answer.

Ask questions **one at a time**, waiting for feedback on each before continuing.

If a question can be answered by exploring the codebase, explore it instead — check OpenWolf's
`.wolf/anatomy.md` first so you read the fewest files.

</what-to-do>

<technique>

### Challenge the language
When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — do you
mean the Customer or the User? Those are different things." Pin the winner; list the rejected
synonyms.

### Discuss concrete scenarios
Stress-test relationships with specific invented scenarios that probe edge cases and force precision
about boundaries between concepts.

### Backtrack and surface conflicts
When a new answer contradicts an earlier one — or the code — say so immediately. "Earlier you said
partial cancellation is possible, but this answer assumes whole-order cancellation. Which is it?"
Branch into the related decisions that the conflict exposes.

### Cross-reference with code
When the user states how something works, check whether the code agrees. Surface contradictions.

</technique>

<output>

This is the engine of outputty's memory model. Do **not** write `CONTEXT.md` or ADRs.

- **Thought-trail** → append a lite line to `.claude/trails/<branch>.md` for each node: the
  question, the decision, and what was branched or dropped.
- **Resolved decisions** → write into `.claude/product.md` (North Star for business, Architecture
  for technical) as they crystallise. Pin canonical terms under a short **Language** subsection.
  Prune stale content — product.md is living, not append-only.

</output>
