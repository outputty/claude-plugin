# The product docs (canonical) — four files, loaded by role

Product memory is a **set of four documents**, not one file. This file is their canonical shape —
`spec.md` (SPEC), `bootstrap` (brownfield), and the merge distill all write them **from this file**.

Measured on a real project, the monolith grew to **~55k tokens, 55% of it roadmap rows** — and every
session paid for all of it, because one file can only be loaded whole. **Splitting alone saves nothing:
four files read together cost the same as one.** The saving is that different work needs different
slices, so each session loads only its slice:

| File | Holds | Who loads it |
| --- | --- | --- |
| `.claude/product.md` | North Star + Language | **Every session** (the protocol's load-first rule) |
| `.claude/roadmap.md` | Status & roadmap | SPEC, PLAN, the before-dispatch staleness check, master QA |
| `.claude/architecture.md` | Target surface + machinery | SPEC (technical pass), PLAN, BUILD agents, master QA |
| `.claude/lessons.md` | Chronology + abandoned approaches | grill's ledger, repeat work, master QA when stuck |

On the measured project that turns the common session's load from ~55k into **~3k** (triage) or **~25k**
(build on a known feature). PLAN still reads everything — that is what PLAN is.

**Migration:** a repo with a monolithic `product.md` splits it at the next merge step — move the
sections, leave a one-line pointer per moved section at the top of `product.md` until the next cycle
confirms nothing still expects them there.

## Living docs, one archive

`product.md`, `roadmap.md` and `architecture.md` are **living: pruned, never append-only.** When a
decision makes prose stale, delete it — a real pivot worth remembering goes to `lessons.md`, the **only
append-only doc**. It exists precisely so the living docs can stay lean: superseded detail has a home to
move to instead of lingering. (`lessons.md` is written at the merge step — the docs agent owns it.)

## The hard verification rule (non-negotiable)

**Every claim about already-shipped behaviour, in any of the four docs, is backed by a run in the
codebase — no guessing, no recall.**

- **Shipped (✅) ⇒ run it.** Before writing what an existing API/command/flag does, run it and use the
  *actual* result. Prose describing shipped behaviour that wasn't run is a defect.
- **Target (🔨 / 📋) ⇒ mark it expected.** Never assert it as shipped. The badge carries the obligation —
  ✅ means "I ran this, here's real output".

---

## `.claude/product.md` — North Star + Language

Small on purpose: this is the one file **every** session reads, so every word costs on every session.

1. **North Star — the pitch + the wedge.** The elevator-pitch first paragraph in plain language (no
   technical examples), then high-level examples one per strong side, then the precise **wedge** — the
   specific thing this does that the alternatives don't. The anchor the whole flow drift-checks against.
2. **Language — the glossary.** Every canonical term, one line each: definition + the rejected synonyms
   it replaces. Current vocabulary only; a dead term is deleted (or its story goes to `lessons.md`).
   Pin a term here **before** using it in the other docs.

## `.claude/roadmap.md` — where things stand

A short "where things stand" paragraph, then **one table, every feature regardless of status**, ordered
so dependencies precede dependents. **A row says what the thing is — it never narrates how it got
built.** Measured: narrated shipped rows averaged **2,238 chars**; disciplined rows **~426** — a 5×
difference, and the narration was already written in the PR and `lessons.md`.

| Feature | Status | Depends on | What it is | Links |
|---|---|---|---|---|
| … | ✅ shipped | — | one line | PR |
| … | 🔨 in progress | … | one line | **plan:** `trails/<branch>.md` |
| … | 📋 planned | … | one line | — |
| … | ❌ killed | — | one line: why | PR / lesson |

- **Live rows carry a plan reference, not progress prose.** Link the branch trail
  (`.claude/trails/<branch>.md`); its `<branch>.tasks.jsonl` sibling is the machine-readable per-task
  status, so progress is *looked up*, never restated here and never allowed to drift.
- **Shipped rows: what it is + the PR.** The story lives in the PR description and `lessons.md`.
- This is **feature-level product memory, not task tracking** — the task graph never moves here.

## `.claude/architecture.md` — the target surface, then its machinery

The old model kept "what you call" (§4) and "how it works" (§5) as two sections; measured, that
produced **~12k tokens of the same topics described twice**. So this doc is organized **per topic:
surface first, mechanism directly under it** — one place per concept, no cross-references between two
halves of the file.

1. **The target program first** — the canonical top-level call, end to end, one fenced code block, with
   **Input / Output as distinct valid-JSON blocks** (real values, no ellipsis; ✅ output is real, 🔨/📋
   marked expected). This is the build's executable acceptance — PLAN pins the last layer to it, master
   QA runs it, every PR write snapshots it (`pr-description.md`).
2. **Then per-topic: the surface, then the seam, then the shape.** For each feature/concept: the
   highest-level example call + knobs with Input/Output JSON, then directly beneath it the mechanism —
   the **seam** (inputs the parent supplies → outputs the child returns; the child knows nothing of its
   parent; PLAN derives task `contract`s from these), and the pattern it leans on, shown as a small
   worked shape, not just named.
3. **Mermaid, never SVG** — this is agent-consumed markdown. (SVG via `diagram` is for the README + PRs.)

Design rationale for a mechanism that **no longer exists** does not live here — that is `lessons.md`
material, however architectural it sounds. Measured: one replaced-mechanism rationale sat in
Architecture at ~4k tokens.

## `.claude/lessons.md` — the archive

The chronology (oldest → latest, one entry per pivot: beginning state · problem · end state · trail
link) **plus** abandoned approaches and what killed each one. Append-only; written at the merge step by
the docs agent; read on demand — grill's ledger checks it, PLAN flags repeat work against it, master QA
opens it when stuck. **Its absence means a first cycle, not an error.**

---

## Skeletons (copy, fill, delete the guidance)

```markdown
# <product> — Product
> North Star + Language only. Every session reads this file — keep it small. Roadmap → roadmap.md,
> surface + machinery → architecture.md, the past → lessons.md. Every ✅ claim is verified by a run.

## North Star
<pitch paragraph; strong-side examples; Wedge: the precise thing alternatives don't do>

## Language
- **<term>** — <one-line definition>. (replaces: <rejected synonyms>)
```

```markdown
# <product> — Roadmap
> One row per feature, one line per row. Live rows link their plan (trail + tasks.jsonl); shipped rows
> link their PR. The story lives in PRs and lessons.md — never here.

<one short paragraph: where things stand>

| Feature | Status | Depends on | What it is | Links |
|---|---|---|---|---|
```

```markdown
# <product> — Architecture
> Surface first, mechanism directly under it — one place per concept. Mermaid, never SVG.

## The target program
<one fenced code block> + Input:/Output: ```json blocks (real if ✅, marked-expected if 🔨/📋)

## <topic>
<surface: example call + knobs + Input/Output JSON>
<mechanism: the seam (parent supplies → child returns), the pattern shown as a worked shape>
```
