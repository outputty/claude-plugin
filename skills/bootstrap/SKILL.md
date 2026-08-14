---
name: bootstrap
description: Bootstrap outputty's product memory for a brownfield repo (no .claude/product.yaml yet) by reconstructing it from existing docs, docstrings, and git history. Run once per repo.
---

# bootstrap — brownfield bootstrap

One job: reconstruct **all six product-memory record sets** from what the repo already knows, then
confirm them with a targeted grilling. No planning, no building. **This skill writes YAML directly.**
It is the one place that authors these files from scratch, so it never goes through `docs.js`
(read-only) for the write itself.

## Preconditions

- Real work here needs git (the `require-environment` guard enforces it); the flow also needs a
  GitHub remote + `gh`. Never blind-scan the tree.
- If `.claude/product.yaml` already exists, stop. Run the normal flow from the session protocol
  instead.

## 1. Branch + draft PR

Same GitHub discipline as any work: cut `chore/bootstrap`, create `.claude/trails/<branch>.trail.yaml`,
commit it, push, open a **draft PR**.

## 2. Pick scan depth (ask the user)

Use the **AskUserQuestion** tool (multi-select) so the user sets the depth of the reconstruction.
Default the two cheap boxes to checked; run only what they confirm:

- **Docs** *(cheap, default on)* — README, `docs/`, existing ADRs/CONTEXT. Richest signal.
- **Docstrings** *(cheap, default on)* — module/class-level intent (skip per-function noise).
- **Commit messages** *(moderate)* — messages, tags, merge commits. History without reading diffs.
- **Deep commit + diff scan** *(EXPENSIVE, default off)* — also reads commit **diffs and reverts** to
  recover the historical pivots that messages rarely state. Gate it behind an explicit check.

## 3. Scan the checked sources

Read each checked source and extract its intent: business goals, technical decisions, historical
pivots, terms. Dispatch `outputty:outputty-scout` per source when a source is large. Read commit
**diffs** only when the deep box was checked; otherwise messages alone.

## 4. Draft all six record sets

Aggregate what you extracted into **draft** product memory. The full rules and every skeleton are in
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`. Read it, and author each file
from its template rather than freehand. Every set gets written, even when the scan found little. An
empty set with its header is a real answer.

| Record set | What bootstrap puts in it |
| --- | --- |
| `product.yaml` | **North Star** (elevator pitch + strong-side examples + wedge) and **Language** (the terms the repo already uses, its own section) |
| `roadmap.yaml` + `roadmap/<name>.md` | one row per target you can name in one sentence, status-badged, deps-ordered, each row a mini-spec `summary`. Everything the repo already ships starts at `✅` |
| `architecture.yaml` + `architecture/*.md` | the coverage index (one record per feature/knob/limitation/pattern the repo ships), plus **target_program** (the concrete program a user writes against the existing surface, with Input/Output JSON) and the **seams** in `protocols`. Mermaid inline, never SVG, never a separate `.mmd` file |
| `tasks.yaml` | the known bugs, debt and task-shaped work the scan surfaced. File each with `tasks.js add`, then `tasks.js index` |
| `lessons.yaml` | the pivots and abandoned approaches the history scan recovered, one record each (`title`, `kind`, `files`, `body`, and `version` when the project versions its releases) |
| `examples.yaml` | the canonical worked examples, lifted from the README's own snippets and verified by running them |

**Reconstruct by running, not guessing.** This repo already ships behaviour. Every claim you write
about an **existing** API or command marked ✅ must be **verified by running it**: real output, no
recall (the template's hard rule). A behaviour you cannot run yet is target (🔨/📋), shown as expected
and marked as such.

## 5. Grill the gaps

Run the `grill` engine, **targeted**: only the gaps, ambiguities, and contradictions the scan
surfaced. Single intent: confirm and complete the record sets. Log each answer to the trail before
asking the next question.

## 6. Finish

Write the six sets, log the trail, mark the PR ready, merge. The normal flow from the session protocol
applies from here on.
