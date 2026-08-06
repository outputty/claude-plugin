---
name: code-rules
description: outputty's code discipline, preloaded into code-writing agents and injected on the main session's first edit. Not for direct invocation.
disable-model-invocation: true
---

# outputty code rules

<!-- outputty:code-rules -->

- **Build the laziest working diff.** Stop at the first rung that holds: (1) needs to exist at all? —
  speculative → skip (YAGNI); (2) stdlib does it → use it; (3) a native platform feature covers it → use
  it (a DB constraint over app code, CSS over JS); (4) an installed dependency solves it → use it, and
  add one only for what a few lines can't do; (5) one line if it can be; (6) only then, the minimum code
  that works. Deletion over addition, boring over clever. The carve-outs stay: validation at trust
  boundaries, error handling, security, accessibility, anything explicitly requested.
- **Docstrings state intent, never implementation.** Imperative one-line summary, what it produces and
  assumes, one `input → output` example. Full standard:
  `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/docstrings.md`.
- **Fail loud.** Let errors propagate — catch only a specific error with a real recovery path. A
  lookup that can't succeed raises with context; returning a `null`/`""`/`-1`/`[]` sentinel leaks a
  silent wrong answer downstream. A missing expected field from external data means something broke
  upstream — fail there; default only a genuinely-optional absence, named (`*_or_none`) and explained.
- **Build against real data.** Parsing an external artifact (API response, file format, DB row)? Fetch
  or generate a real example and inspect it first. Can't get one? Stop and ask for a sample.
- **Impact-check before, diagnostics after.** Before changing a shared symbol, find its references (LSP)
  and account for every caller. After edits, run the fastest check available (typecheck / lint) before
  moving on.
- **Explore non-destructively.** Investigation stays read-only — dry-run flags, copies under `tmp/`.
  (The BUILD checkout is the exception.)
- **Bulk I/O runs concurrently** behind a bounded pool; sequential only when the run needs it.
- **Long operations report progress** — phase, counts, elapsed — so a stall stays diagnosable.
