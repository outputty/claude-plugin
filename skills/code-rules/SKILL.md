---
name: code-rules
description: The code discipline a session applies before its first edit: the reuse ladder, its finding tags, docstrings, real-data testing. Do NOT use for a diff review or a repo survey.
---

# outputty code rules

Input: the code you are about to write, or the diff you are about to judge. Output: the laziest diff that
works, and one tagged finding line per defect.

## The finding line

Every tag names one defect. One defect per line, in this format:

`<file>:<line>: <tag> <what>. <replacement>.`

```text
src/store/writer.ts:88: oddball: a second write path beside `commit()`. Route it through `commit()`.
```

## The tags

1. **`yagni:`** - code written for a speculative need.
2. **`stdlib:`** - a hand-rolled routine that the standard library already ships.
3. **`native:`** - app code doing what the platform does natively.
4. **`dep:`** - a hand-rolled helper that an installed dependency already provides.
5. **`shrink:`** - a long form where a shorter one reads the same.
6. **`delete:`** - code already in the tree that nothing needs.
7. **`oddball:`** - a structural change that does not match its siblings.
8. **`complexity:`** - a unit too big to hold in a reader's head.
9. **`defensive:`** - a guard or a catch with no real recovery path.

## The reuse ladder

Build the laziest working diff. Climb the rungs in order, and stop at the first one that holds.

1. **`yagni:`** - does it need to exist? Skip a speculative need: an abstraction with one implementation,
   config nobody sets, a layer with one caller.
2. **`upstream:`** - the same fix at the source deletes this one. A guard the caller stops needing, a
   shape corrected where it is built, a field that stops being optional. Fix it there when that folder
   is in scope, and report it as a finding when it is not.
3. **`stdlib:`** - the standard library does it, so use the stdlib.
4. **`native:`** - a native platform feature covers it, so use it. A DB constraint beats app code, and CSS
   beats JS.
5. **`dep:`** - an installed dependency solves it, so use it. Add a dependency only for what a few lines
   cannot do.
6. **`shrink:`** - a shorter form reads the same, so write the shorter form.
7. Write the minimum code that works. This rung is terminal and untagged.

- **`delete:` is the same ladder aimed at code already there** - dead code, unused flexibility, a
  speculative feature. Replace it with nothing. Prefer deletion over addition, and boring over clever.
- **Carve-outs the ladder keeps** - validation at trust boundaries, security, accessibility, and anything
  the user asked for. Error handling that propagates or routes the error is a carve-out too.
- **A swallow is a `defensive:` finding** - report it as one.
- **A single smoke test and a required docstring are the minimum** - leave both untagged.

## The `oddball:` tag - a structural change matches its siblings

The check runs on a **structural** diff only. Every other diff is exempt, and exempt is silent. A whole-repo
survey has no diff, so `oddball:` fires there on an inconsistent
pattern across the codebase.

A change is structural when any one of these holds:

1. A new file in a populated folder.
2. A new named unit in a file already holding two or more of its kind.
3. A new or changed exported signature.

Every other change is exempt: an edit inside one existing unit's body, a value, constant or copy change, a
rename, or docs.

On a structural change, find the pattern to match. First match wins:

1. **`architecture.md`'s feature index names the pattern** - use it, and match its shape rather than its
   spirit.
2. **No pattern named, but the code holds one** - read the nearest two examples (`LSP` references, or
   `Grep`) and match them. An undocumented convention is still a convention.
3. **Neither fits, and you are fighting the code** - build to the existing pattern anyway, and report it. A
   new pattern is an `architecture.md` edit, and that surface is gated.

**Fighting the code has an evidence bar.** The existing shape forces a meaningless parameter, a cast,
duplicated branching at three call sites, or a test needing a fake. "This felt cleaner" is not evidence. A
pattern used once is not a pattern. Consistency beats local optimality.

## The `complexity:` tag - keep a unit inside a reader's head

Decompose past ~7 branches (cyclomatic > 7), or past 7 variables in scope (params + locals + fields). Name
the split, or fold the arguments into a parameter object. Decomposition makes essential complexity
legible, and keeps all of it.

## The `defensive:` tag - fail loud

- Let errors propagate. Catch one specific error, and only with a real recovery path.
- Delete a catch clause, a null-guard or a fallback-default that has no recovery path. It swallows a crash
  that should reach the top-level handler. Let it crash.
- Raise with context from a lookup that cannot succeed. A `null`, `""`, `-1` or `[]` sentinel leaks a wrong
  answer downstream.
- Fail at the parse when external data is missing an expected field. Something broke upstream.
- Default only a genuinely-optional absence. Name it (`*_or_none`) and explain it.

## Docstrings state intent

- Carry one on every new or changed exported unit. Internal helpers carry none.
- Write an imperative one-line summary, what it produces and assumes, and one `input → output` example.
- Use the language's idiom (Google-style `"""…"""`, JSDoc, `///`).
- Split the unit when the docstring runs longer than the function it documents.

## Test names and inline comments

- Write a test name as one sentence:
  `"backfill() lands windowed rows without moving the live cursor"`. The spike file and the assertions stay
  in the test body.
- Earn an inline comment by explaining a non-obvious *why*. Narrating the next three lines is noise the
  reader skips.

## Build against real data, and test against the real thing

- Fetch or generate a real example of any external artifact you parse (API response, file format, DB row),
  and inspect it first.
- Stop and ask for a sample when you cannot get one.
- Run the real dependency in tests: a temp table, a throwaway database, or a real client locally. No fake
  engines, stubs or mocks when the real dependency can run.
- Mock only what cannot run locally, and say why in the test.

## While you work

- **Impact-check before a change** - find every reference of a shared symbol and account for each caller.
- **Run diagnostics after** - run the fastest check available (typecheck, lint) before moving on.
- **Sweep config and docs after a rename** - `LSP rename` cannot reach a string in a config file, a doc or
  a comment. Grep the whole tree for the old name, and confirm it is clean.
- **Explore non-destructively** - keep investigation read-only: dry-run flags, copies under `tmp/`.
- **Run bulk I/O concurrently** - use a bounded pool past ~10 items. Run sequentially only where the run
  needs the order.
- **Report progress on a long operation** - print phase, counts and elapsed past ~10 seconds. A stall then
  stays diagnosable.
