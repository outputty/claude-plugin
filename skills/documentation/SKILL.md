---
name: documentation
description: Write, rewrite, or audit a README or project doc to outputty's code-forward standard — including de-slopping one that reads AI-generated. Use for any README or project-docs writing or improvement request. Reaches for diagram only when a diagram earns its place.
---

# documentation — technical READMEs that read like a person wrote them

A README earns trust in the first screen and keeps it by being concrete: *"I know what this is"* in one
sentence, *"it's running"* in a minute, *"I get the core idea"* through code the reader can copy — and
only then, how it fits together.

## Principle

**Concrete beats comprehensive, and code beats prose.** Prose that would be true of a dozen other
projects is the slop smell; a specific noun, number, or line of code is the antidote. Route out only
exhaustive reference — never the core.

## The shape (default order — glance → run → grok → understand)

Not a rigid template. Install-first is fine when prerequisites are heavy (native SDK, DB, creds).

1. **Title + one-line what-is-it** — H1 = name, then *"X is a `<category>` that `<does Y>`."*
2. **Badges** *(optional)* — one line, decision-informing live-status only (build, version, license).
3. **Requirements** — terse runtime/version/platform line, **before** the quickstart.
4. **Install / quickstart** — shortest path to a visible result, above the fold.
5. **Core concepts — code-forward** — 2–4 real examples, one concept each, **code first, prose second**.
   The heart of the README; don't starve it to stay short.
6. **Architecture / how it works** — the bird's-eye view, *after* the reader has touched the code.
7. **Usage / config, docs, license** *(as needed)* — links, not embedded manuals.

## Checklist (audit the doc against each)

- **One-sentence what-is-it** before badges or TOC — what it is and the problem it solves.
- **Proof-of-life early** — the shortest runnable example (or minimal artifact/screenshot), **paired
  with its expected result** so the reader can confirm success.
- **Requirements up front**, terse — a missing runtime turns first-run into a fake bug.
- **Core concepts shown in code, not prose** — real examples (no `foo`/`bar`), each paired with its
  output. A paragraph with no example beside it either gets code or gets cut.
- **Architecture after the code** — topology + the non-obvious decisions; **not** an API dump (reference
  detail routes out to linked files).
- **No slop** — cut throat-clearing openers, binary contrasts ("not just X — it's Y"), hollow
  superlatives (seamless/powerful/robust), meta-commentary, and vague could-be-any-project claims;
  replace each with a noun, number, or line of code. *(tells + fixes: `references/writing.md`)*
- **Paste-safe fences** — no `$`/`>` prefixes, output out of the command fence, **language-tag every
  block** (` ```bash `/` ```ts `/` ```json `).
- **Describe, don't sell** — third-person declarative for the project, imperative for instructions.
- **Scannable** — keyword-front-loaded headings + bullets; short prose blocks; TOC only on a long file.
- **Stay in sync** — commands, examples, diagrams match the code; relative links in-repo; never
  duplicate content that lives elsewhere.
- **Badges/visuals earn their place** — live-status badges only (fine to have none); a hero visual only
  for visual tools, never the sole carrier of essential info.
- **Length follows substance** — cut filler, never the teaching code.

## Diagrams — via `diagram`, only when earned

Add one **only** when it encodes relationships prose serialises poorly: system **architecture** (3+
components), **data/control flow** across boundaries, a **state machine**, or a **decision tree**.
Linear steps → a numbered list wins. When warranted, produce it with **`diagram`** (committed
SVG, relative-path embed), place it once atop the architecture section, and add a one-line text summary
so it degrades gracefully. Test: *does it show topology a short paragraph plus the code above it
can't?* If no, cut it.

## Depth

When drafting or auditing prose, read **[`references/writing.md`](references/writing.md)** — the concrete
anti-slop tells with fixes, how to teach concepts code-first, and the architecture-after guidance.
