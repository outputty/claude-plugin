---
name: documentation
description: Writes or rewrites a README or project doc to outputty's code-forward standard, de-slopping one that reads AI-generated. Use when the user asks to write, fix or de-slop docs. Do NOT use for a read-only findings pass (that is audit).
---

# documentation - technical READMEs that read like a person wrote them

## Principle

**Concrete beats comprehensive, and code beats prose.** Prose true of a dozen other projects is slop; a
specific noun, number, or line of code is the fix. Route out only exhaustive reference, never the core. Cut
filler, never the teaching code.

## The shape (default order: glance, run, grok, understand)

Not rigid. Install-first is fine when prerequisites are heavy (native SDK, DB, creds).

1. **Title plus one-line what-is-it** - H1 = name, then *"X is a `<category>` that `<does Y>`."*
2. **Badges** *(optional)* - one line, decision-informing live-status only (build, version, license).
3. **Requirements** - terse runtime, version and platform line, **before** the quickstart.
4. **Install and quickstart** - shortest path to a visible result, above the fold.
5. **Core concepts, code-forward and progressive** - 2 to 4 real examples, one concept each, **code first,
   prose second**. Order as a **complexity ladder**:
   1. **Minimal working example** - 5 to 10 lines: construct, call, print. All defaults, no error handling.
   2. **A real scenario** - production shape: the timeout, the retry, the `except` branch, the async form.
   3. **Advanced and edge cases** - batching, custom middleware, tuning. Wrap a long one in
      `<details><summary>…</summary>`.
6. **Architecture, or how it works** - the bird's-eye view, *after* the reader has touched the code.
7. **Usage, config, docs and license** *(only what a reader must have)* - links, not embedded manuals.
   Environment variables and flags go in a **table with a Default and a Required column**:

   | Variable | Description | Default | Required |
   |---|---|---|---|
   | `API_KEY` | Auth key for the upstream API | none | **yes** |
   | `TIMEOUT_MS` | Network request timeout | `5000` | no |

## Checklist (audit the doc against each)

- **Cut slop** - delete claims that fit any project ("built for developers who value speed") and
  meta-commentary ("this section walks through installation"). Replace each with a noun, a number, or a line
  of code.
- **Keep fences paste-safe** - drop the `$` and `>` prefixes, and move output out of the command fence.
  **Language-tag every block** (` ```bash `, ` ```ts `, ` ```json `).
- **Make it scannable** - front-load keywords in headings and bullets, and keep prose blocks short. Add a TOC
  only on a long file.
- **Stay in sync** - match commands, examples and diagrams to the code, and keep in-repo links relative.
  Never duplicate content that lives elsewhere.

## Diagrams, only when earned

Add one **only** when it encodes relationships that prose serialises poorly. That means system architecture
(3+ components), data flow or control flow across boundaries, a state machine, or a decision tree. Linear
steps get a numbered list instead. Place an earned diagram once atop the architecture section, then add a
one-line text summary.

The surface decides the format, and the same earned-or-not test applies to both rows:

| Surface | Format |
| --- | --- |
| `README.md`, and a PR or issue body or comment | committed SVG, produced by `diagram` |
| Every other Markdown file, `docs/**` and `.claude/**` included | inline Mermaid, in the file that owns it |
