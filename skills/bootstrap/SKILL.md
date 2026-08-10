---
name: bootstrap
description: Bootstrap outputty's product docs for a brownfield repo (no .claude/product.yaml yet) by reconstructing North Star + Architecture from existing docs, docstrings, and git history. Run once per repo.
---

# bootstrap — brownfield bootstrap

One job: reconstruct the product docs (`.claude/{product,roadmap,architecture}.yaml`) from what the repo
already knows, then confirm them with a
targeted grilling. No planning, no building. **This skill writes YAML directly** — it is the one place
that authors these files from scratch, so it never goes through `docs.js` (read-only) for the write
itself.

## Preconditions

- Real work here needs git (the `require-environment` guard enforces it); the flow also needs a
  GitHub remote + `gh`. **Navigate with the LSP** if the language has a server, `Grep`/`Glob`
  otherwise — do not blind-scan the tree.
- If `.claude/product.yaml` already exists, stop — this is not a brownfield bootstrap. Use
  `outputty`.

## 1. Branch + draft PR

Same GitHub discipline as any work: cut `chore/bootstrap`, create `.claude/trails/<branch>.md`,
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

Aggregate the scanner output into **draft** product docs, each section to its file per the canonical
split (the
full rules + skeleton are in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md` —
read it): **North Star** (elevator pitch + strong-side examples + wedge) → **Status & roadmap** (every
feature, status-badged, deps-ordered) → **Language** (terms, its own section) → **What we're building
towards** (the concrete program a user/agent writes against the repo's existing surface with Input/Output
JSON, then per-feature detail — for brownfield, reconstruct it from the README's own examples) →
**Architecture** (direction-level, the **seams** between layers folded in, Mermaid flowcharts — never SVG
in agent-consumed markdown) → **History** (the chronology; big pivots become its first entries). Then run
the `grill` engine — but **targeted**: only the gaps, ambiguities, and contradictions the scan
surfaced. Single intent: confirm and complete the knowledgebase.

**Reconstruct by running, not guessing.** This repo already ships behaviour. Every claim you write about
an **existing** API/command marked ✅ shipped must be **verified by running it in the codebase** — real
output, no recall (the template's hard rule). A behaviour you can't run yet is target (🔨/📋), shown as
expected and marked as such.

## 5. Finish

Write the product docs, log the trail, mark the PR ready, merge. The normal `outputty`
flow applies from here on.
