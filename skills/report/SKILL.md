---
name: report
description: Render a finished unit of work as a styled, self-contained HTML report — summary tables, a "what we're building towards" program with real input/output blocks, swimlane or flowchart diagrams, and a "what was tried before and why it didn't work" section. Use when delivering a summary, report, investigation result, or design write-up the user will read rather than skim in the terminal.
---

# report — deliver a unit of work as a styled HTML report

A finished unit of work is **read**, not skimmed. Terminal markdown flattens exactly what carries the
meaning — a swimlane, a before/after pair, a table you scan across. This skill renders the work as a
self-contained HTML page published with the `Artifact` tool.

**It renders the canonical structure; it does not invent one.** The section order below is
[`../outputty/references/pr-description.md`](../outputty/references/pr-description.md)'s, with one
addition (*What was tried before*). When the two disagree, that spec wins — a report and the PR comment
describing the same work must not tell different stories.

## When to reach for it — and when not to

| Situation | Surface |
|---|---|
| A finished unit of work, investigation, or design write-up | **this skill** |
| A completed BUILD layer, a merged feature, an audit result | **this skill** |
| Answering a question, confirming an edit, a one-line result | terminal reply — an artifact is overkill |
| Anything the flow already writes to a PR | the PR, via `pr-description.md` |

One report per **unit of work** — a layer, a feature, an investigation. Not per turn, and never as a
wrapper around a two-sentence answer.

## Required sections, in this order

**1. Summary — a table, not prose.** What changed and why, one row per item. The reader decides here
whether to keep going.

**2. What we're building towards.** The canonical top-level program from `product.md`, **copied not
paraphrased**, annotated ✅ for what's real and ⏳ for what still waits. Below it, **input and output as
separate labelled blocks** — never an inline `# -> …` comment.

**Output is real or it is labelled expected. There is no third option.** If nothing ran the program, the
block says so (`Output (expected — not yet run)`). An imagined result presented as a real one is the
failure this rule exists to prevent: the reader has no way to tell.

When the surface isn't data — a CLI that prints a flow, a UI — show its observable result in kind.

**3. One section per unit of work.** Heading matches its summary row. Inside: **why** in plain language
→ **how to call it** (top-level DX only; omit the section entirely if nothing is callable yet) → **how to
verify** → **gotcha-only tests** as a table. Never list routine tests.

**4. What was tried before, and why it didn't work.** Include it **whenever there is prior art** — an
earlier design, a reverted attempt, an approach the user proposed and evidence killed. A table:

| Attempt | Why it was tried | Why it didn't work |
|---|---|---|

**This section is the point of writing reports down.** Without it the next person re-runs a dead end that
already cost someone a day, and a rejected idea comes back every few weeks because nothing records why it
lost. Two rules keep it honest: **name the evidence that killed it**, not a vibe ("QA failed it 3 rounds
running", "measured 183/615 shell calls"), and **say when it would become viable again** if the blocker
was circumstantial. No prior art → omit the section; never pad it with a strawman.

**5. The flow, as a diagram** — only when the flow actually changed.

**6. Keep in mind.** Future work, gotchas found, known gaps. Say plainly what is unverified.

## Diagrams — Mermaid, and why that's not a rule violation

The always-on rule routes **Mermaid to agent-read markdown, SVG to human-presentation surfaces**. An
artifact is a third case the binary rule doesn't cover: it is human-facing, *and* it renders Mermaid
natively from a `<pre class="mermaid">` block. So inside a report, **use Mermaid** — no `diagram` call, no
committed SVG, no external library.

| Change | Diagram |
|---|---|
| Who does what, across agents or stages | **swimlane** (`flowchart` with `subgraph` lanes) |
| A new process end to end | flowchart, the whole thing |
| A step added to an existing flow | exactly 5 nodes: summary → before → **the step** → after → summary |
| How an existing flow works, changed | **before/after pair**, stacked |
| A bugfix that changes no flow | none — don't draw one to look thorough |

## Building the page

**Load `artifact-design` before writing the page** — it calibrates the treatment. A work report is
utilitarian: real typographic hierarchy and a considered palette, no landing-page hero.

Hard constraints, all enforced by the artifact CSP:

- **Self-contained.** No CDN scripts, external stylesheets, webfonts, or remote images. Inline
  everything; embed assets as `data:` URIs.
- **Both themes.** Define the palette as custom properties on `:root`, redefine under
  `@media (prefers-color-scheme: dark)`, and again under `:root[data-theme="dark"]` /
  `:root[data-theme="light"]` so the viewer's toggle wins.
- **No horizontal page scroll.** Tables, code blocks, and diagrams each get their own
  `overflow-x: auto` container.
- Write the page body only — no `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>`; those are added at publish.

Then `Artifact` with the file path, a stable `title`, a one-sentence `description`, and a `favicon`.
**Keep the file path and favicon stable across updates** — re-publishing the same path redeploys to the
same URL, and a changed favicon reads to the user as a different page.

## Tone

Same as everywhere else: lead with the answer, state uncertainty as uncertainty, and never let the styling
imply more confidence than the evidence supports. A report that looks finished but hides an unverified
claim is worse than a terse reply that admits the gap.
