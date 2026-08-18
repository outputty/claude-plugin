---
name: documentation
description: Write, rewrite, or audit a README or project doc to outputty's code-forward standard — including de-slopping one that reads AI-generated. Use for any README or project-docs writing or improvement request. Reaches for diagram only when a diagram earns its place.
---

# documentation — technical READMEs that read like a person wrote them

## Principle

**Concrete beats comprehensive, and code beats prose.** Prose true of a dozen other projects is slop; a
specific noun, number, or line of code is the fix. Route out only exhaustive reference — never the core.

## The shape (default order — glance → run → grok → understand)

Not rigid. Install-first is fine when prerequisites are heavy (native SDK, DB, creds).

1. **Title + one-line what-is-it** — H1 = name, then *"X is a `<category>` that `<does Y>`."*
2. **Badges** *(optional)* — one line, decision-informing live-status only (build, version, license).
3. **Requirements** — terse runtime/version/platform line, **before** the quickstart.
4. **Install / quickstart** — shortest path to a visible result, above the fold.
5. **Core concepts — code-forward, progressive** — 2–4 real examples, one concept each, **code first, prose
   second**. Order as a **complexity ladder**:
   1. **Minimal working example** — 5–10 lines: construct, call, print. All defaults, no error handling.
   2. **A real scenario** — production shape: the timeout, the retry, the `except` branch, the async form.
   3. **Advanced / edge cases** — batching, custom middleware, tuning. Wrap a long one in
      `<details><summary>…</summary>`.
6. **Architecture / how it works** — the bird's-eye view, *after* the reader has touched the code.
7. **Usage / config, docs, license** *(only what a reader must have)* — links, not embedded manuals.
   Environment variables and flags go in a **table with a Default and a Required column**:

   | Variable | Description | Default | Required |
   |---|---|---|---|
   | `API_KEY` | Auth key for the upstream API | — | **yes** |
   | `TIMEOUT_MS` | Network request timeout | `5000` | no |

## Checklist (audit the doc against each)

- **No slop** — cut throat-clearing openers, binary contrasts ("not just X — it's Y"), hollow superlatives,
  meta-commentary, and vague could-be-any-project claims;
  replace each with a noun, number, or line of code.
- **Paste-safe fences** — no `$`/`>` prefixes, output out of the command fence, **language-tag every block**
  (` ```bash `/` ```ts `/` ```json `).
- **Scannable** — keyword-front-loaded headings + bullets; short prose blocks; TOC only on a long file.
- **Stay in sync** — commands, examples, diagrams match the code; relative links in-repo; never duplicate
  content that lives elsewhere.
- **Length follows substance** — cut filler, never the teaching code.

## Diagrams — via `diagram`, only when earned

Add one **only** when it encodes relationships prose serialises poorly: system **architecture** (3+
components), **data/control flow** across boundaries, a **state machine**, or a **decision tree**. Linear
steps → a numbered list wins. When warranted, produce it with **`diagram`** (committed SVG, relative-path
embed), place it once atop the architecture section, and add a one-line text summary. Test: *does it show
topology a short paragraph plus the code can't?* If no, cut it.
