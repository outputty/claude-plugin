---
name: code-rules
description: The code discipline a session applies before its first edit: the reuse ladder, its finding tags, docstrings, real-data testing. Do NOT use for a diff review or a repo survey.
---

# outputty code rules

Every tag names one defect. A review reports one per line:
`<file>:<line>: <tag> <what>. <replacement>.`

```text
src/store/writer.ts:88: oddball: a second write path beside `commit()`. Route it through `commit()`.
```

| Tag | Fires on |
| --- | --- |
| `yagni:` | code written for a speculative need |
| `stdlib:` | a hand-rolled routine that the standard library already ships |
| `native:` | app code doing what the platform does natively |
| `dep:` | a hand-rolled helper that an installed dependency already provides |
| `shrink:` | a long form where a shorter one reads the same |
| `delete:` | code already in the tree that nothing needs |
| `oddball:` | a structural change that does not match its siblings |
| `complexity:` | a unit too big to hold in a reader's head |
| `defensive:` | a guard or a catch with no real recovery path |

- **Build the laziest working diff.** Stop at the first rung that holds.
  1. `yagni:` does it need to exist? Skip a speculative need - an abstraction with one implementation,
     config nobody sets, a layer with one caller.
  2. `stdlib:` the standard library does it → use the stdlib.
  3. `native:` a native platform feature covers it → use it. A DB constraint beats app code; CSS beats JS.
  4. `dep:` an installed dependency solves it → use it. Add a dependency only for what a few lines
     cannot do.
  5. `shrink:` it fits in fewer lines → write the shorter form.
  6. Only then, write the minimum code that works. Rung 6 is terminal and untagged.

  The `delete:` tag is the same ladder aimed at code already there: dead code, unused flexibility, a
  speculative feature. Replace it with nothing. Prefer deletion over addition, and boring over clever.
  These carve-outs always stay: validation at trust boundaries, error handling that propagates or routes
  the error, security, accessibility, and anything the user asked for. A swallow is a `defensive:` finding,
  never a carve-out. A single smoke test and a required docstring are the minimum, never bloat. Never tag
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
  **A pattern used once is not a pattern.** **Consistency beats local optimality.**
- **`complexity:` keep a unit inside a reader's head.** Decompose past ~7 branches (cyclomatic > 7), or past
  7 variables in scope (params + locals + fields). Name the split, or fold the arguments into a parameter
  object. This is essential complexity made legible; decompose it, never delete it.
- **Docstrings state intent, never implementation.** Every new or changed exported unit carries one.
  Internal helpers do not. Write an imperative one-line summary, what it produces and assumes, and one
  `input → output` example. Use the language's idiom (Google-style `"""…"""`, JSDoc, `///`). A docstring
  longer than the function it documents is a decomposition signal.
- **Test names and inline comments obey the same discipline.** A test name is a sentence, not a paragraph:
  `"backfill() lands windowed rows without moving the live cursor"`, never a 190-character name citing a
  spike file and repeating the assertions. An inline comment earns its place by explaining a non-obvious
  *why*; narrating the next three lines is noise the reader skips.
- **Fail loud (`defensive:`).** Let errors propagate. Catch only a specific error with a real recovery
  path. A `try`/`catch`, null-guard, or fallback-default with no real recovery path swallows a crash that
  should reach the top-level handler; delete it, let it crash. A lookup that cannot succeed raises with
  context; returning a `null`/`""`/`-1`/`[]` sentinel leaks a silent wrong answer downstream. A missing
  expected field from external data means something broke upstream: fail there. Default only a
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
- **Explore non-destructively.** Investigation stays read-only: dry-run flags, copies under `tmp/`. (The
  BUILD checkout is the exception.)
- **Bulk I/O runs concurrently** behind a bounded pool past ~10 items. It runs sequentially only where the
  run needs the order.
- **Long operations report progress** past ~10 seconds: phase, counts, elapsed. A stall then stays
  diagnosable.
