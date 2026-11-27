---
name: review
description: "Reviews a build from inside the build session with a saved ultracode workflow: a commit pre-flight, up to six Haiku readers on Standards, Spec, Correctness, Provenance, Tests and Simplicity chosen from the diff, and a Sonnet judge, with the advisor, that assumes the builder lies, then posts each finding as a GitHub thread; a recheck settles only the threads still open, and a docs check runs after the docs layer. Use as /review with a PR number, or when a build hands over a PR."
argument-hint: "<pr number> [recheck <round>]"
---

# review

Input: a PR number, and for a recheck the round and the pinned head of the review. Output: the review's threads and body on the PR, or after a recheck the threads resolved, replied to or reopened. The review edits no file and runs no test.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Pick the mode: `full` for a PR that has no thread starting `[review`, `recheck` for one that has; a recheck's round is how many rechecks have run, this one included. After the docs layer the mode is `docs`, once per PR.
- [ ] 2. Resolve `~/.claude/skills` to its absolute path, then call `Workflow` with `scriptPath` `<skills dir>/outputty-review/references/review.workflow.js` and `args` `{mode, pr, base, skillsDir}`, plus `pinnedHead` and `round` for a recheck. Take `pinnedHead` from the first line of the review's body, [references/report.md](references/report.md).
- [ ] 3. Read the verdict the workflow returns.
  - `stop`: the pre-flight stopped the review before any reader ran: a commit carries most of the diff's code lines, or its message has no body saying why. Redo the commits it named as separate commits, each with its why in the body, then run the full review once more.
  - `findings`: the threads are on the PR. Address every one, then run a recheck.
  - `clean`: nothing is open; go on.
  - The verdict names the axes that ran and each axis skipped with its reason; a `docs` run returns `findings` or `clean` the same way.
- [ ] 4. After a recheck, read its verdict. `clean`: every thread is resolved. `open`: address what is still open, then run a recheck again. `cap`: the second recheck left threads open; they stay on the PR for the user.

The workflow runs six readers from [references/standards-brief.md](references/standards-brief.md), [references/spec-brief.md](references/spec-brief.md), [references/correctness-brief.md](references/correctness-brief.md), [references/provenance-brief.md](references/provenance-brief.md), [references/tests-brief.md](references/tests-brief.md) and [references/simplicity-brief.md](references/simplicity-brief.md), after the pre-flight of [references/preflight-brief.md](references/preflight-brief.md) and the evidence of [references/evidence-brief.md](references/evidence-brief.md) and before the verdict of [references/judge-brief.md](references/judge-brief.md); a recheck follows [references/recheck-brief.md](references/recheck-brief.md). Every reader also follows [references/reader-contract.md](references/reader-contract.md). The Standards reader always carries the baseline of [references/smells.md](references/smells.md). The workflow skips an axis with nothing to read, and lists it under Not run: Standards and Correctness without code lines, Spec without a spec, Tests without a spec or a test file, Provenance without an added file, export or dependency, and Simplicity under 30 code lines. The `docs` mode runs one reader from [references/docs-brief.md](references/docs-brief.md).

## Do

- Load the script by `scriptPath` from the installed skill folder, never inline and never from the PR's worktree: the builder must not be able to edit its own review.
- Put only ids and paths in `args`: the agents fetch the ticket, the diff and the log themselves, so no summary from the builder reaches them.
- Address every thread: a fix commit and a one-line reply with its `file:line` pointer, or a reply whose pointer shows the finding is wrong. The reply is the answer to a question the judge asked.
- Run one full review per PR and at most two rechecks.
- Tell the user the count of threads still open when a recheck returns `cap`.

## Don't

- Don't resolve, close or reopen a thread: only a recheck does.
- Don't post the review from the build session: only the workflow posts.
- Don't ask the builder a question outside a thread.
- Don't run the full review again after it posted its threads.
- Don't treat a thread as addressed because the builder said so: the recheck opens the source.

## Glossary

- **Fixed point** - the commit the review diffs the PR head against: `origin/<base>`.
- **Pre-flight** - the check, in plain code, of the commits before any reader starts: none carries most of the diff's code lines, and each message has a body that says why; whether a commit does one action is the judge's call.
- **Thread** - one review comment on a line of the diff, opened by the review and closed only by a recheck; its first line is a marker such as `[review F3 tests]`.
- **Recheck** - the small review that opens the source behind each open thread and the fix commits, and resolves, answers or reopens threads.
- **Judge** - the Sonnet agent that opens every cited source itself, drops what fails, writes the valid questions and consults the advisor once when a finding is architectural or contested.
- **Docs** - the check, run after the six axes and the docs layer, asking whether the documentation matches what the diff changed.
- **Standards** - the axis asking whether the diff follows the repo's documented code rules.
- **Spec** - the axis asking whether the diff does what the ticket asked, no more and no less.
- **Correctness** - the axis asking whether the diff has bugs, and whether code that reads right compiles and types right.
- **Provenance** - the axis asking where each new type, pattern, abstraction, dependency and file came from.
- **Tests** - the axis asking which Implementation criterion each new test proves.
- **Simplicity** - the axis asking what the smallest change meeting the criteria is, and where the diff is bigger.
- **Smell baseline** - twelve Fowler code smells the Standards axis always carries, each a judgement call.
