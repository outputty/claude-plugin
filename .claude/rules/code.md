# Code

Each line is one rule: the moment, then the action.

## Fail loud

- A catch, null-guard or fallback default with no recovery path is deleted; the error propagates.
- A lookup that cannot succeed raises with context; it never returns `null`, `""`, `-1` or `[]`.
- External data missing an expected field fails at the parse.
- A red test means the change is wrong: fix the code and leave the assertion as it stands.

## Shape

- A new file, a new unit beside two of its kind, or a changed exported signature matches the nearest
  two existing examples. Fighting the code is reported, never done in place.
- A unit past 7 branches or 7 variables in scope is split, and the split is named.
- A new seam names its two adapters (production plus a fake, two backends, old and new path) before
  it exists. No second adapter: inline it.
- A restructure lands the new path beside the old one or behind a flag, and files the removal as its
  own issue. A merged PR never ships half a cutover.
- Simplification keeps every test unchanged. A test is deleted only with the feature it covers, and
  that deletion is recorded as a decision first.

## Prove it

- A parser is written after inspecting a real sample of the artifact it parses.
- Tests run the real dependency (a temp table, a throwaway database, a local client). A mock covers
  only what cannot run locally, and the test says why.
- Before trusting a passing test, ask whether it still passes with the new code deleted.
- "This does not work" is stated after reproducing it twice: the specific case, then a stripped-down
  case with the business logic removed.
- Test, build and lint commands come from the repo's CLAUDE.md, README or manifest scripts.

## Names and pointers

- Every new or changed exported unit carries a docstring: what it produces, what the caller owes, one
  `input → output` line. Internal helpers carry none.
- A docstring names symbols, never line numbers, and each symbol is resolved with `LSP` before it is
  written. A pointer at nothing compiles like a correct one.
- After a rename or move, `git grep` the old name across prose and comments and fix every hit before
  the commit. Confirm each hit with `LSP`; a name match is not a type match.
- A commit subject is the change's title under 72 characters; the body is one line, problem then
  solution.

## While you work

- An escape sequence is written with the `Edit` tool. A heredoc, `sed` or a script resolves the
  escape first and lands a raw control byte.
- Bulk I/O past ~10 items runs in a bounded pool; sequential only where order matters.
- An operation past ~10 seconds prints phase, counts and elapsed time.
- A review session runs only read-or-compute commands, and captures `git status --porcelain` before
  and after each. A command that deploys, publishes, pays or migrates a shared store is reported as
  not run, with what a human must run instead.
- A fix that fails twice after a real diagnosis stops. Report both diagnoses and the second fix.
