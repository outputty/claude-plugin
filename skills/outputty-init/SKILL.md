---
name: outputty-init
description: Bootstrap outputty's product.md for a BROWNFIELD project by reconstructing the North Star + Architecture from what already exists — docs, docstrings, and (optionally) git history. Use once, when a repo has no .claude/product.md yet. A targeted, single-intent scoping session over existing artifacts.
---

# outputty-init — brownfield bootstrap

One job: reconstruct `.claude/product.md` from what the repo already knows, then confirm it with a
targeted grilling. No planning, no building.

## Preconditions

- The SessionStart hook already checked the full environment (OpenWolf CLI, git, authenticated GitHub
  remote). In particular `openwolf init` has run, so `.wolf/anatomy.md` exists — **use it to
  navigate**; do not blind-scan the tree.
- If `.claude/product.md` already exists, stop — this is not a brownfield bootstrap. Use
  `outputty`.

## 1. Branch + draft PR

Same GitHub discipline as any work: cut `chore/outputty-init`, create `.claude/trails/<branch>.md`,
commit it, push, open a **draft PR**.

## 2. Pick scan depth (ask the user)

Use the **AskUserQuestion** tool (multi-select) so the user sets the depth of the reconstruction.
Default the two cheap boxes to checked; run only what they confirm:

- **Docs** *(cheap, default on)* — README, `docs/`, existing ADRs/CONTEXT. Richest signal.
- **Docstrings** *(cheap, default on)* — module/class-level intent (skip per-function noise).
- **Commit messages** *(moderate)* — messages, tags, merge commits. History without reading diffs.
- **Deep commit + diff scan** *(EXPENSIVE, default off)* — also reads commit **diffs and reverts** to
  recover the historical pivots that messages rarely state. Gate this behind an explicit check: it is
  the slow, costly path, worth it only when a repo's decisions live in its history, not its docs.

## 3. Scan with the cheapest agent

Dispatch one `outputty:scanner` subagent (haiku) **per checked source**, in parallel. Each returns
extracted intent: business goals, technical decisions, historical pivots, terms. This is grunt work —
keep it on the cheap agent. Tell the commit scanner **"deep"** only when the deep box was checked, so
it reads diffs/reverts; otherwise it stays on messages only.

## 4. Draft, then grill the gaps

Aggregate the scanner output into a **draft** `.claude/product.md` (North Star + Architecture; a
Language subsection for terms; big pivots become the first "What was tried" entries). Then run the
`outputty-grill` engine — but **targeted**: only the gaps, ambiguities, and contradictions the scan
surfaced. Single intent: confirm and complete the knowledgebase.

## 5. Finish

Write `.claude/product.md`, log the trail, mark the PR ready, merge. The normal `outputty`
flow applies from here on.
