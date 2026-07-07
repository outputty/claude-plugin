---
name: outputty-grill
description: Grilling session that stress-tests a plan one question at a time. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Outputs go to product.md, the branch trail, and a glossary — not CONTEXT.md/ADRs.
---

<what-to-do>

Interview the user relentlessly about every aspect of the plan until you reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between decisions
one by one. For each question, provide your recommended answer.

Ask questions **one at a time**, waiting for feedback on each before continuing. Keep each question
short — one idea, one recommendation. If the framing is longer than the decision, cut the framing.

If a question can be answered by exploring the codebase, explore it instead — check OpenWolf's
`.wolf/anatomy.md` first so you read the fewest files.

</what-to-do>

<technique>

### Challenge the language
When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — do you
mean the Customer or the User? Those are different things." Pin the winner; list the rejected
synonyms. Every pinned term goes into `glossary.md` (see output).

### Ground abstract decisions in a concrete example
Whenever a question turns on a non-obvious concept — and *always* the moment the user signals they're
lost ("I don't get it", "over my head", "too verbose") — stop explaining in the abstract. Walk
through one small worked example instead: a before/after, or a step-by-step of a single interaction,
built **only from the canonical terms already in the glossary** (never fresh jargon). Show the
concrete flow, then re-ask the question in one plain sentence with your recommendation. An example
the user can picture beats a paragraph of theory every time.

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
  for technical) as they crystallise. Prune stale content — product.md is living, not append-only.
- **Glossary** → maintain `.claude/glossary.md` in parallel as the canonical reference for the
  project's language. Every time a term is pinned, add or update its entry: the canonical term, a
  one-line definition, and the rejected synonyms it replaces. Keep it alphabetical and deduplicated.
  Phrase every later question and example using these terms — this is the shared vocabulary the
  plan, build, and docs phases all read from.

</output>

<session-end>

When the grilling session ends — the plan is resolved, or the user wraps up — store what was learned
into OpenWolf **manually and immediately**. Do not wait for a background pass to run.

- **`.wolf/cerebrum.md`** — append the user preferences, corrections, and decisions surfaced during
  grilling, into the right sections (User Preferences / Key Learnings / Decision Log / Do-Not-Repeat)
  per OpenWolf's rules.
- **`.wolf/memory.md`** — append a one-line summary of the session.
- **`.wolf/buglog.json`** — log any bug or gotcha uncovered while cross-referencing the code.

Write these before ending the turn. Any fact that is also project vocabulary belongs in
`glossary.md` too.

</session-end>
