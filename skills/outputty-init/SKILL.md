---
name: outputty-init
description: Bootstrap outputty's product.md for a BROWNFIELD project by reconstructing the North Star + Architecture from what already exists — docs, docstrings, and (optionally) git history. Use once, when a repo has no .claude/product.md yet. A targeted, single-intent scoping session over existing artifacts.
---

# outputty-init — brownfield bootstrap

One job: reconstruct `.claude/product.md` from what the repo already knows, then confirm it with a
targeted grilling. No planning, no building.

## Preconditions

- The SessionStart hook already enforced OpenWolf + git + remote. In particular `openwolf init` has
  run, so `.wolf/anatomy.md` exists — **use it to navigate**; do not blind-scan the tree.
- If `.claude/product.md` already exists, stop — this is not a brownfield bootstrap. Use
  `outputty`.

## 1. Branch + draft PR

Same GitHub discipline as any work: cut `chore/outputty-init`, create `.claude/trails/<branch>.md`,
commit it, push, open a **draft PR**.

## 2. Pick sources (user chooses)

Ask the user with a **multi-select** question which sources to scan, then execute only what they pick:

- **Docs** — README, `docs/`, existing ADRs / CONTEXT (richest signal).
- **Docstrings** — module/class-level intent (skip per-function noise).
- **Commit history (messages)** — decision-bearing messages, tags, merge commits. Grinding *all*
  messages is fine **if the user opts in** — it is the expensive one, so it is opt-in, never default.

## 3. Scan with the cheapest agent

Dispatch one `outputty:scanner` subagent (haiku) **per selected source**, in parallel. Each returns
extracted intent: business goals, technical decisions, historical pivots, terms. This is grunt work —
keep it on the cheap agent.

## 4. Draft, then grill the gaps

Aggregate the scanner output into a **draft** `.claude/product.md` (North Star + Architecture; a
Language subsection for terms; big pivots become the first "What was tried" entries). Then run the
`outputty-grill` engine — but **targeted**: only the gaps, ambiguities, and contradictions the scan
surfaced. Single intent: confirm and complete the knowledgebase.

## 5. Finish

Write `.claude/product.md`, log the trail, mark the PR ready, merge. The normal `outputty`
flow applies from here on.
