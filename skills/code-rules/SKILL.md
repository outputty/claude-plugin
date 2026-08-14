---
name: code-rules
description: outputty's code discipline, preloaded into code-writing agents and injected into the main session at start. Not for direct invocation.
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

  `delete:` is the same ladder aimed at code already there — dead code, unused flexibility, a
  speculative feature. Replace it with nothing. Prefer deletion over addition, and boring over clever.
  These carve-outs always stay: validation at trust boundaries, error handling, security,
  accessibility, and anything the user asked for. A single smoke test and a mandated docstring are the
  minimum, never bloat — never tag either.
- **`complexity:` keep a unit inside a reader's head.** Past ~7 branches (cyclomatic > 7), or too many
  variables in scope (params + locals + fields), decompose so it fits — name the split, or fold the
  arguments into a parameter object. This is essential complexity made legible, not dead code:
  decompose it, do not delete it.
- **Docstrings state intent, never implementation.** Imperative one-line summary, what it produces and
  assumes, one `input → output` example. Use the language's idiom (Google-style `"""…"""`, JSDoc,
  `///`). A docstring longer than the function it documents is a decomposition signal.
- **Test names and inline comments obey the same discipline.** A test name is a sentence, not a
  paragraph: `"backfill() lands windowed rows without moving the live cursor"`, never a 190-character
  name citing a spike file and repeating the assertions. An inline comment earns its place by
  explaining a non-obvious *why*; narrating the next three lines is noise the reader skips.
- **Fail loud (`defensive:`).** Let errors propagate — catch only a specific error with a real recovery
  path. A `try`/`catch`, null-guard, or fallback-default with no real recovery path swallows a crash
  that should reach the top-level handler; delete it, let it crash. A
  lookup that can't succeed raises with context; returning a `null`/`""`/`-1`/`[]` sentinel leaks a
  silent wrong answer downstream. A missing expected field from external data means something broke
  upstream — fail there; default only a genuinely-optional absence, named (`*_or_none`) and explained.
- **Build against real data, and test against the real thing.** Parsing an external artifact (API
  response, file format, DB row)? Fetch or generate a real example and inspect it first. Can't get one?
  Stop and ask for a sample. **This covers tests too.** No fake engines, stubs or mocks when the real
  dependency can run. Use a temp table, a throwaway database, or a real client locally. A fake proves
  your fake works. Mock only what cannot run locally, and say why in the test.
- **Impact-check before, diagnostics after.** Before changing a shared symbol, find its references (LSP)
  and account for every caller. After edits, run the fastest check available (typecheck / lint) before
  moving on.
- **Sweep config and docs after a rename.** `LSP rename` covers code and structurally cannot reach a
  string in a config file, a doc, or a comment. Grep the whole tree for the old name and confirm it is
  clean before you call the rename done.
- **Explore non-destructively.** Investigation stays read-only — dry-run flags, copies under `tmp/`.
  (The BUILD checkout is the exception.)
- **Bulk I/O runs concurrently** behind a bounded pool; sequential only when the run needs it.
- **Long operations report progress** — phase, counts, elapsed — so a stall stays diagnosable.
