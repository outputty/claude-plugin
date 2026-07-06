---
name: outputty-documentation
description: Write, rewrite, or audit a technical README (or similar project doc) to a clean, concise, generalized standard — front-loaded, scannable, a routing hub not a manual. Use when the user wants to write, rewrite, improve, tidy, or audit a README or project docs. Produces a diagram via the outputty-diagram skill only when one genuinely earns its place.
---

# outputty:documentation — clean technical READMEs

A README's job is orientation: get a reader to first success, then route them out to real docs. Short
and correct beats long and comprehensive. Apply this ruleset when writing or rewriting one; audit an
existing README against it and fix what fails.

## One principle

**Front-load ruthlessly and route depth out.** The most-scanned thing goes first — at the document
(what/why in sentence one), the section (key point in the first line), and the sentence (actor +
verb). If a section reads like a spec or a manual, it belongs in a linked file, not the README.

## Section order (a default, not a rigid template)

Driven by front-loading. Install-first is fine when prerequisites are heavy (native SDK, DB, creds).

1. **Title + one-line description** — H1 = repo/package name, then one sentence: *"X is a `<category>`
   that `<does Y>`."*
2. **Badges** *(optional)* — one line, decision-informing live-status only (build, version, license).
3. **Requirements** — a terse runtime/version/platform line, **before** the quickstart.
4. **Quickstart / first success** — the shortest path to a visible result, above the fold.
5. **Usage / configuration** *(as needed)* — common cases; link out for the full reference.
6. **Docs / contributing** *(as needed)* — links, not embedded manuals.
7. **License** — last, if the repo is publicly distributed (omit for private/internal).

## Rules (check the doc against each)

1. **Sentence one** states what it is and the problem it solves, before badges or TOC. Anchor to a
   known tool only when the project is a drop-in alternative ("a `cat` clone") — skip the framing
   otherwise.
2. **Proof-of-life early.** Show the shortest runnable example (libraries/CLIs) *or* the minimal
   artifact — command + output, or a screenshot (apps, data, infra) — **paired with its expected
   result** so the reader can confirm success.
3. **Paste-safe commands.** No `$`/`>` prompt prefixes; keep program output out of the command fence;
   **tag every fenced block with its language** (` ```bash `, ` ```ts `, ` ```json `). A setup
   sequence may share one block (one command per line) — just never interleave its output.
4. **Requirements up front**, terse, near the top — not buried in prose. A missing runtime/version
   turns first-run into a fake bug.
5. **Routing hub, not manual.** Move exhaustive reference, tutorials, and long build guides to linked
   files. Never duplicate content that lives (and stays current) elsewhere.
6. **Scannable.** Keyword-front-loaded headings + bullets; keep prose blocks short. A TOC only on a
   long file.
7. **Describe, don't sell.** Cut unverifiable superlatives (*simply, just, easy, blazing fast*); make
   claims specific. Describe the project in third-person declarative and give instructions in the
   imperative — consistent within each register, not one voice throughout.
8. **Badges earn their place** — only live-status ones that inform a decision; drop the rest. Fine to
   have none (internal repos usually do).
9. **One hero visual**, high up, only for visual tools; never let an image be the *sole* carrier of
   essential information (it needs a text equivalent).
10. **Stay in sync.** Commands and links must match the code; use relative links for in-repo
    references (they survive forks/renames).

## Diagrams — via `outputty-diagram`, only when earned

Add a diagram **only** when it encodes relationships prose serialises poorly, in one of four cases:
system **architecture** (3+ interacting components), **data/control flow** across boundaries, a
**state machine / lifecycle**, or a **decision tree**. Linear or sequential steps → a numbered list
always wins.

When one is warranted: produce it with the **`outputty-diagram`** skill (self-contained committed SVG
— versions with the code, reviewable in diffs, embeds with a relative path), place it once at the top
of the relevant section, show only the components that matter, and add a **one-line text summary**
beside it so it degrades gracefully (screen-readers, surfaces that don't render it). Most READMEs need
zero.

Checkable test before adding any diagram: *does this show topology a short paragraph plus an example
can't?* If no, cut it.

## Length

Shorter is better — a general repo rarely needs more than ~1200 words, and a repo with a full docs
site can shrink to a one-screen landing page. Treat any number as a default, not a limit.

## Anti-patterns (the four that bite)

- **Badge soup** — decorative badges pushing the description below the fold.
- **README-as-manual** — API dumps / long guides that duplicate the docs and rot.
- **Stale content** — commands or diagrams drifted out of sync with the code.
- **Decorative diagram** — a flowchart for linear steps a numbered list already covers.
