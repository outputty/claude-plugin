# product.md structure (canonical)

`.claude/product.md` is the single source for **what** a product is and **why**. This file is the
canonical shape every product.md follows — the rules per section (below) and a copy-paste **skeleton**
(bottom). `spec.md` (SPEC), `bootstrap` (brownfield bootstrap), and the merge distill all write
product.md **from this file** — read it, don't improvise the section order.

The doc reads **top-down, surface → depth**: the pitch, then where things stand, then the words, then
the surface a user touches, then the machinery, then the past. Six sections, in this order.

## Living above, frozen below

Sections **1–5 are living: pruned, never append-only.** When a decision makes prose stale, delete it —
or, if it's a real pivot worth remembering, **move it down into History** (§6). History is the **only**
append-only section; it exists precisely so the current sections can stay lean (superseded detail has a
home to move to instead of lingering up top). This is what "prune, don't accrete" means in practice.

## The hard verification rule (non-negotiable)

**Every claim about already-shipped behaviour in product.md is backed by a run in the codebase — no
guessing, no recall.** This is the always-on verify-by-running rule made mandatory for this doc:

- **Shipped (✅) ⇒ run it.** Before you write what an existing API/command/flag does, or paste an
  example output, **run it in the codebase** and use the *actual* result. Prose describing shipped
  behaviour that wasn't run is a defect — the code read routinely surfaces that the old prose was wrong
  (a default that isn't the default, a unit that's fixed not inferred, a policy claimed as shipped that
  isn't). Reading the doc must never require re-deriving the truth.
- **Target (🔨 / 📋) ⇒ mark it expected.** Not-yet-built behaviour is the *target*: show it, label it
  expected, and **never assert it as shipped.** The status badge (§2) carries the obligation — ✅ means
  "I ran this, here's real output"; 🔨/📋 means "this is where we're headed."

The badge and the verification duty are the same fact seen twice. Keep them consistent.

## 1. North Star — the pitch + the wedge

Why this exists, in business terms. Two parts:

1. **Elevator pitch first paragraph** — the highest-level statement of the product, in plain language a
   non-engineer grasps. No technical examples here; just what it is and the outcome it delivers.
   Something that *illustrates* the product, not its internals.
2. **Then the strong-side examples** — high-level, illustrative examples that showcase each of the
   product's strong sides. Still high-level (what the user gets, not how), one per distinct strength.

State the precise **wedge** too: the specific thing this does that the alternatives don't. This is the
anchor the whole flow drifts-checks against — keep it sharp.

## 2. Status & roadmap — where things stand

A short **"where things stand"** paragraph, then **one table listing every feature regardless of
status**, status-badged and ordered so dependencies come before what depends on them:

| Feature | Status | Depends on | Notes |
|---|---|---|---|
| … | ✅ shipped | — | … |
| … | 🔨 in progress | … | … |
| … | 📋 planned | … | … |

Badges: **✅ shipped** · **🔨 in progress** · **📋 planned**. This is **feature-level product memory**,
not task tracking — the per-branch task graph lives in the trail (`<branch>.tasks.jsonl`), never here.
The badge here is what the verification rule keys off (see above).

## 3. Language — the glossary

Its own top-level section (not a subsection). Every canonical term, one line each: the term, a one-line
definition, and the rejected synonyms it replaces. **Current vocabulary only** — a term the product no
longer uses moves to History or is deleted. This is the shared vocabulary §4/§5 and every downstream
phase read from; pin a term here **before** using it elsewhere in the doc.

## 4. What we're building towards — the target surface & its features

The concrete finished surface a user/agent actually touches, descending **whole → part**. Informed by
the North Star, but not the North Star: it shows the surface **explicitly**.

1. **The target program first** — the canonical top-level call, the way the whole thing composes end to
   end (source → transform → destination for pipeline work; the toppest-level call otherwise). One fenced
   code block: real call shape, simplified data, never the implementation. Below it, **Input / Output as
   distinct valid-JSON blocks** — each its own ` ```json ` block labelled `Input:` / `Output:`, real
   values a reader can copy and validate, no ellipsis, no prose stand-ins, no inline `# -> …` comment.
   (Non-data surfaces — a CLI that prints a flow, a UI — show their observable result in kind.)
2. **Then per-feature detail** — one subsection per feature/capability, each at the **highest level
   possible**: the knobs/options it exposes (a small table when there are several), an example call, and
   its own **Input / Output JSON blocks**. Show every strong side of the feature at the surface level;
   push mechanics to §5.

**The verification rule governs every example here.** A ✅ feature's example Output is the *real* output
you ran; a 🔨/📋 feature's is the *expected* output, marked. This section is the build's executable
acceptance — PLAN pins the last layer to the target program, master QA re-runs it — and the canonical
code every PR write **snapshots** (see `pr-description.md`).

## 5. Architecture — the machinery, one level down

The solution below the surface: general direction and the verified constraints, **no line-level detail**.
Three things belong here:

1. **Seams (the protocols between layers).** Per seam: the inputs the parent supplies and the outputs
   the child returns. **The child knows nothing about its parent** — it exposes inputs → outputs; the
   parent composes. PLAN derives each task `contract` from these seams; a genuinely new seam is an
   Architecture edit surfaced at the gate, never invented mid-build.
2. **Shape** — the packages/modules and how they stack.
3. **Patterns, shown explicitly** — for each underlying pattern the design leans on, show it (a small
   worked shape), don't just name it.

**Heavy on Mermaid flowcharts.** product.md is agent-consumed markdown — agents read text, not pictures —
so diagram with **Mermaid**, never SVG. (SVGs via `diagram` are for human surfaces: the README
and PR bodies.)

## 6. History — the chronology, oldest → latest

The entire chronology of the product, **oldest first**: every notable pivot and the frozen detail of
superseded designs, folded in here so §1–5 stay current. One entry per pivot — beginning state, the
problem, the end state landed on, and a link to the branch trail where it was decided. This is the
**on-demand archive** (don't dwell on it in normal work) and the **only append-only section**.

---

## Skeleton (copy, fill, delete the guidance)

```markdown
# <product> — Product

> Single source for what <product> is and why. §1–5 living (pruned, not append-only); §6 History is the
> frozen archive. Decisions live here, never in OpenWolf. Every ✅ claim is verified by a run.

## North Star

<elevator-pitch first paragraph — plain language, no technical examples, what it is + the outcome>

<high-level examples, one per strong side — what the user gets, not how>

Wedge: <the precise thing this does that the alternatives don't>

## Status & roadmap

<one short paragraph: where things stand right now>

| Feature | Status | Depends on | Notes |
|---|---|---|---|
| <feature> | ✅ shipped | — | <note> |
| <feature> | 🔨 in progress | <feature> | <note> |
| <feature> | 📋 planned | <feature> | <note> |

## Language

- **<term>** — <one-line definition>. (replaces: <rejected synonyms>)

## What we're building towards

<the target program — one fenced code block: real call shape, simplified data, not the implementation>

Input:
```json
<valid JSON — real values a reader can copy and validate; no ellipsis, no prose>
```
Output:
```json
<valid JSON — REAL output for ✅ shipped; expected (marked) for 🔨/📋 target>
```

### <feature>
<highest-level example call + its knobs, with Input:/Output: JSON blocks — real if ✅, marked-expected if not>

## Architecture

<direction-level prose + Mermaid flowcharts (never SVG). Show each pattern explicitly.>

### Seams (protocols between layers)
<per seam: inputs the parent supplies → outputs the child returns; the child knows nothing of its parent>

## History

<oldest → latest. One entry per pivot: beginning state · the problem · the end state landed on · trail link.>
```
