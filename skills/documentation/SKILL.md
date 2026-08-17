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
5. **Core concepts — code-forward, and progressive** — 2–4 real examples, one concept each, **code
   first, prose second**. The heart of the README; don't starve it to stay short. Order them as a
   **complexity ladder**, so a reader stops at the tier that matches their need:
   1. **Minimal working example** — 5–10 lines: construct, call, print. All defaults, no error handling.
   2. **A real scenario** — what production actually looks like: the timeout, the retry, the `except`
      branch, the async form.
   3. **Advanced / edge cases** — batching, custom middleware, tuning. Wrap a long one in
      `<details><summary>…</summary>` so it doesn't cost scannability to include it.
6. **Architecture / how it works** — the bird's-eye view, *after* the reader has touched the code.
7. **Usage / config, docs, license** *(only what a reader must have)* — links, not embedded manuals. Environment
   variables and flags go in a **table with a Default and a Required column**:

   | Variable | Description | Default | Required |
   |---|---|---|---|
   | `API_KEY` | Auth key for the upstream API | — | **yes** |
   | `TIMEOUT_MS` | Network request timeout | `5000` | no |

## Checklist (audit the doc against each)

The shape above sets the content and order; this is what a finished doc must also clear:

- **No slop** — cut throat-clearing openers, binary contrasts ("not just X — it's Y"), hollow
  superlatives, meta-commentary, and vague could-be-any-project claims (the output style's claudism list
  is the full set); replace each with a noun, number, or line of code.
- **Paste-safe fences** — no `$`/`>` prefixes, output out of the command fence, **language-tag every
  block** (` ```bash `/` ```ts `/` ```json `).
- **Scannable** — keyword-front-loaded headings + bullets; short prose blocks; TOC only on a long file.
- **Stay in sync** — commands, examples, diagrams match the code; relative links in-repo; never
  duplicate content that lives elsewhere.
- **Length follows substance** — cut filler, never the teaching code.

## Diagrams — via `diagram`, only when earned

Add one **only** when it encodes relationships prose serialises poorly: system **architecture** (3+
components), **data/control flow** across boundaries, a **state machine**, or a **decision tree**.
Linear steps → a numbered list wins. When warranted, produce it with **`diagram`** (committed
SVG, relative-path embed), place it once atop the architecture section, and add a one-line text summary
so it degrades gracefully. Test: *does it show topology a short paragraph plus the code above it
can't?* If no, cut it.
