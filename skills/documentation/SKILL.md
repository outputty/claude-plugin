---
name: documentation
description: Writes or rewrites a README or project doc to outputty's code-forward standard, de-slopping one that reads AI-generated. Use when the user asks to write, fix or de-slop docs. Do NOT use for a read-only findings pass (that is audit).
---

# documentation - technical READMEs that read like a person wrote them

Input: the doc to write, and the code that it describes.

Output: that doc, written in place.

## Principle

Concrete beats comprehensive, and code beats prose. Prose that is true of a dozen other projects is slop.
Route out exhaustive reference, and keep the core in place. Cut filler, and keep the teaching code.

## The shape (default order: glance, run, grok, understand)

Not rigid. Install-first is fine when prerequisites are heavy (native SDK, DB, creds).

1. **Title plus one-line what-is-it** - H1 = name, then *"X is a `<category>` that `<does Y>`."*
2. **Badges** *(optional)* - one line, decision-informing live-status only (build, version, license).
3. **Requirements** - terse runtime, version and platform line, above the quickstart.
4. **Install and quickstart** - shortest path to a visible result, above the fold.
5. **Core concepts, code-forward and progressive** - 2 to 4 real examples, one concept each, code first and
   prose second. Order them as a complexity ladder:
   1. **Minimal working example** - 5 to 10 lines: construct, call, print. All defaults, no error handling.
   2. **A real scenario** - production shape: the timeout, the retry, the `except` branch, the async form.
   3. **Advanced and edge cases** - batching, custom middleware, tuning. Wrap a long one in
      `<details><summary>…</summary>`.
6. **Architecture, or how it works** - the bird's-eye view, *after* the reader has touched the code.
7. **Usage, config, docs and license** *(only what a reader must have)* - links, not embedded manuals. Each
   environment variable and flag takes its own list item, which names the default and says whether the
   variable is required.

## Checklist (audit the doc against each)

- **Keep fences paste-safe** - drop the `$` and `>` prefixes, and move output out of the command fence.
- **Language-tag every block** - ` ```bash `, ` ```ts `, ` ```json `.
- **Make it scannable** - front-load keywords in headings and bullets, and keep prose blocks short. Add a
  TOC only on a long file.
- **Stay in sync** - match commands, examples and diagrams to the code, and keep in-repo links relative.

## Diagrams, only when earned

Open `diagram`, section *Where a picture belongs*. It decides whether a picture is earned, and which format
the landing surface takes.

An earned picture sits once atop the architecture section, with a one-line text summary under it.
