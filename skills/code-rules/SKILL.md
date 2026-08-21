---
name: code-rules
description: outputty's code discipline — the reuse ladder, tags, docstrings, real-data testing. Code-writing sessions apply it; the CLAUDE.md block makes it mandatory. Not for direct invocation.
---

# outputty code rules

<!-- outputty:code-rules -->

- **Build the laziest working diff.** Stop at the first rung that holds. Each rung's tag is the name a
  review finding uses — one line per finding, `L<n>: <tag> <what>. <replacement>.`
  1. `yagni:` does it need to exist? Skip a speculative need — an abstraction with one implementation,
     config nobody sets, a layer with one caller.
  2. `stdlib:` the standard library does it → use the stdlib.
  3. `native:` a native platform feature covers it → use it. A DB constraint beats app code; CSS beats JS.
  4. An installed dependency solves it → use it. Add a dependency only for what a few lines cannot do.
  5. `shrink:` it fits in fewer lines → write the shorter form.
  6. Only then, write the minimum code that works.

  `delete:` is the same ladder aimed at code already there — dead code, unused flexibility, a speculative
  feature. Replace it with nothing. Prefer deletion over addition, and boring over clever. These carve-outs
  always stay: validation at trust boundaries, error handling, security, accessibility, and anything the
  user asked for. A single smoke test and a mandated docstring are the minimum, never bloat — never tag
  either.
- **`oddball:` a structural change matches its siblings.** It runs on a **structural** diff only. Every
  other diff is exempt, and exempt is silent: never report a skipped check.

  | Structural, so the ladder runs | Exempt, so it does not |
  | --- | --- |
  | a new file in a populated folder | an edit inside one existing unit's body |
  | a new named unit in a file already holding two or more of its kind | a value, constant or copy change |
  | a new or changed exported signature | a rename, or docs |

  | You find | You do |
  | --- | --- |
  | `architecture.md`'s feature index names the pattern | Use it. Match its shape, not its spirit. |
  | No pattern named, but the code holds one | Read the **nearest two** examples (`LSP` references, or `Grep`) and match them. An undocumented convention is still a convention. |
  | Neither fits, and you are fighting the code | Build to the existing pattern anyway, and **report it**. A new pattern is an `architecture.md` edit, and that surface is gated. |

  **Fighting the code has an evidence bar.** The existing shape forces a meaningless parameter, a cast,
  duplicated branching at three call sites, or a test needing a fake. "This felt cleaner" is not.
  **A pattern used once is not a pattern.** **Consistency beats local optimality**: a shape matching the
  other twenty call sites beats a better one matching none.
- **`complexity:` keep a unit inside a reader's head.** Decompose past ~7 branches (cyclomatic > 7), or past
  too many variables in scope (params + locals + fields). Name the split, or fold the arguments into a
  parameter object. This is essential complexity made legible; decompose it, never delete it.
- **Docstrings state intent, never implementation.** Imperative one-line summary, what it produces and
  assumes, one `input → output` example. Use the language's idiom (Google-style `"""…"""`, JSDoc, `///`). A
  docstring longer than the function it documents is a decomposition signal.
- **Test names and inline comments obey the same discipline.** A test name is a sentence, not a paragraph:
  `"backfill() lands windowed rows without moving the live cursor"`, never a 190-character name citing a
  spike file and repeating the assertions. An inline comment earns its place by explaining a non-obvious
  *why*; narrating the next three lines is noise the reader skips.
- **Fail loud (`defensive:`).** Let errors propagate — catch only a specific error with a real recovery
  path. A `try`/`catch`, null-guard, or fallback-default with no real recovery path swallows a crash that
  should reach the top-level handler; delete it, let it crash. A lookup that cannot succeed raises with
  context; returning a `null`/`""`/`-1`/`[]` sentinel leaks a silent wrong answer downstream. A missing
  expected field from external data means something broke upstream — fail there; default only a
  genuinely-optional absence, named (`*_or_none`) and explained.
- **Build against real data, and test against the real thing.** Parsing an external artifact (API response,
  file format, DB row)? Fetch or generate a real example and inspect it first. Can't get one? Stop and ask
  for a sample. **This covers tests too.** No fake engines, stubs or mocks when the real dependency can run.
  Use a temp table, a throwaway database, or a real client locally. Mock only what cannot run locally, and
  say why in the test.
- **Impact-check before, diagnostics after.** Before changing a shared symbol, find its references (LSP) and
  account for every caller. After edits, run the fastest check available (typecheck / lint) before moving
  on.
- **Sweep config and docs after a rename.** `LSP rename` covers code. It cannot reach a string in a config
  file, a doc, or a comment. Grep the whole tree for the old name. Confirm it is clean before you call the
  rename done.
- **Explore non-destructively.** Investigation stays read-only — dry-run flags, copies under `tmp/`. (The
  BUILD checkout is the exception.)
- **Bulk I/O runs concurrently** behind a bounded pool; sequential only when the run needs it.
- **Long operations report progress** — phase, counts, elapsed — so a stall stays diagnosable.
