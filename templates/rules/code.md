# Code

Each line is one rule: the moment, then the action.

## Reuse, before writing

- Climb in order before new code: does it need to exist at all; can the fix land upstream where the shape is built; does the standard library do it; does the platform do it natively (a DB constraint beats app code, CSS beats JS); does an installed dependency do it; is there a shorter form that reads the same. Only then write the minimum.
- The same ladder aimed at code already there: dead code, unused flexibility and a speculative feature are deleted, not kept.
- Carve-outs: validation at a trust boundary, security, accessibility, error handling that propagates, and what the user asked for.

## Fail loud

- A catch, null-guard or fallback default with no recovery path is deleted; the error propagates.
- A lookup that cannot succeed raises with context; it never returns `null`, `""`, `-1` or `[]`.
- External data missing an expected field fails at the parse.
- A seam trusts the caller's intent. A guard against a misuse the caller could mean is not written.
- An assertion is never loosened or deleted to reach green; the code moves to fit the test.

## Shape

- A new file, a new unit beside two of its kind, or a changed exported signature matches the nearest two existing examples. Fighting the code is reported, never done in place.
- A unit past 7 branches or 7 variables in scope is split, and the split is named.
- A knob's home is decided by what it describes, not by what merely references it.
- A new seam names its two adapters (production plus a fake, two backends, old and new path) before it exists. No second adapter: inline it.
- A restructure lands the new path behind one flag, tested end to end with the flag on; the same stack ends with an enable layer that deletes the flag and the old path. A merged PR never ships half a cutover.
- Simplification keeps every test unchanged. A test is deleted only with the feature it covers, and that deletion is recorded as a decision first.
- A `spike-<slug>` test answers one design question and is deleted once the answer is recorded. It never reaches a PR.

## Prove it

- A parser is written after inspecting a real sample of the artifact it parses.
- Tests run the real dependency (a temp table, a throwaway database, a local client). A mock covers only what cannot run locally, and the test says why.
- Before trusting a passing test, ask whether it still passes with the new code deleted.
- A docstring's or comment's claim about runtime behaviour is not evidence; run it before relying on it.
- A probe shaped like the proposal it tests presupposes the answer; shape it neutrally.
- "This does not work" is stated after reproducing it twice: the specific case, then a stripped-down case with the business logic removed.

## Names and pointers

- Every new or changed exported unit carries a docstring: what it produces, what the caller owes, why this mechanism where the obvious one would be undone, one `input → output` line. Delete the docstring in your head: if the signature already said it all, the docstring is a defect. Internal helpers carry none.
- A docstring names symbols, never line numbers, and each symbol is resolved with `LSP` before it is written. A pointer at nothing compiles like a correct one.
- After a rename or move, `git grep` the old name across prose and comments and fix every hit before the commit. Confirm each hit with `LSP`; a name match is not a type match.
- A commit subject is the change's title under 72 characters; the body is one line, problem then solution.

## Prose, in any file

- Every fenced block carries a language tag.
- Sentences hold to ASD-STE100: instructions under 20 words, descriptions under 25, one instruction per sentence, active voice, one term per meaning. Paragraphs run one to three sentences.

## While you work

- An escape sequence is written with the `Edit` tool. A heredoc, `sed` or a script resolves the escape first and lands a raw control byte.
- A review session runs only read-or-compute commands, and captures `git status --porcelain` before and after each. A command that deploys, publishes, pays or migrates a shared store is reported as not run, with what a human must run instead.
- A fix that fails twice after a real diagnosis stops. Report both diagnoses and the second fix.
