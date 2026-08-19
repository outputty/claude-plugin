---
name: bootstrap
description: Bootstrap outputty's product memory for a brownfield repo (no .claude/product.md yet) by reconstructing it from existing docs, docstrings, and git history. Run once per repo.
---

# bootstrap — brownfield bootstrap

One job: reconstruct **all five product-memory docs** from what the repo knows, then confirm them with a
targeted grilling. No planning, no building. **This skill writes the prose Markdown docs directly.**

## Preconditions

- **Run `init` first** — it writes the managed `outputty:begin` block into CLAUDE.md.
- Needs git, a GitHub remote, and `gh`. Never blind-scan the tree.
- If `.claude/product.md` already exists, stop. Run the normal flow instead.

## 1. Branch + draft PR

Same GitHub discipline as any work: cut `chore/bootstrap`, commit, push, open a **draft PR**.

## 2. Pick scan depth (ask the user)

Use **AskUserQuestion** (multi-select) to set reconstruction depth. Default the two cheap boxes checked; run
only what they confirm:

- **Docs** *(cheap, default on)* — README, `docs/`, existing ADRs/CONTEXT.
- **Docstrings** *(cheap, default on)* — module/class-level intent (skip per-function noise).
- **Commit messages** *(moderate)* — messages, tags, merge commits. History without reading diffs.
- **Deep commit + diff scan** *(EXPENSIVE, default off)* — also reads commit **diffs and reverts** for
  historical pivots. Gate behind an explicit check.

## 3. Scan the checked sources

Read each checked source and extract its intent: business goals, technical decisions, historical pivots,
terms. Dispatch the `scout` skill on `outputty:outputty-reviewer` per source when a source is large. Read
commit **diffs** only when the deep box was checked; otherwise messages alone.

## 4. Draft all five docs

Aggregate what you extracted into **draft** product memory. The full rules and every skeleton are in
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`. Read it, and author each file from
its template, not freehand. Write every doc, even when the scan found little — an empty doc with its header
is a real answer.

| Doc | What bootstrap puts in it |
| --- | --- |
| `product.md` | **North Star** (elevator pitch + strong-side examples + wedge) and **Language** (the terms the repo already uses, its own section) |
| `roadmap.md` | one entry per target you can name in one sentence, status-badged, deps-ordered, each a mini-spec. Everything the repo already ships starts at `✅` |
| `architecture.md` | the **target program** (the concrete program a user writes against the existing surface, with Input/Output JSON), the machinery, the **seams**, and a **feature-index** table (one row per feature/knob/limitation/pattern the repo ships) |
| the `tasks` MCP server | the known bugs, debt and task-shaped work the scan surfaced. File each with the `tasks` MCP tool `add_task` `{ project, id, title, brief }` |
| `lessons.md` | the pivots and abandoned approaches the history scan recovered, one bold-title-led entry each with a `Files:` line (and a version when the project versions its releases) |
| `examples.md` | the canonical worked examples, lifted from the README's own snippets and verified by running them |

**Mark a behaviour you cannot run yet as target (🔨/📋), expected**, never ✅.

## 5. Grill the gaps

Run the `grill` engine **targeted**: only the gaps, ambiguities, and contradictions the scan surfaced.
Single intent: confirm and complete the docs. Record each answer before asking the next question.

## 6. Finish

Write the five docs, mark the PR ready, merge. The normal session-protocol flow applies from here.
