---
name: review
description: "Reviews a build from inside the build session with a saved ultracode workflow: a commit pre-flight, six Sonnet readers on Standards, Spec, Correctness, Provenance, Tests and Simplicity, and an Opus judge that assumes the builder lies, then posts each finding as a GitHub thread; a recheck settles only the threads still open. Use as /review with a PR number, or when a build hands over a PR."
argument-hint: "<pr number> [recheck <round>]"
---

# review

Input: a PR number, and for a recheck the round and the pinned head of the review. Output: the review's threads and body on the PR, or after a recheck the threads resolved, replied to or reopened. The review edits no file and runs no test.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Pick the mode: `full` for a PR that has no thread starting `[review`, `recheck` for one that has; a recheck's round is how many rechecks have run, this one included.
- [ ] 2. Resolve `~/.claude/skills` to its absolute path, then call `Workflow` with `scriptPath` `<skills dir>/outputty-review/references/review.workflow.js` and `args` `{mode, pr, base, skillsDir}`, plus `pinnedHead` and `round` for a recheck. Take `pinnedHead` from the first line of the review's body, [references/report.md](references/report.md).
- [ ] 3. Read the verdict the workflow returns.
  - `stop`: the pre-flight stopped the review before any reader ran. Split the commits it named, or fix what its reason says, then run the full review once more.
  - `findings`: the threads are on the PR. Address every one, then run a recheck.
  - `clean`: nothing is open; go on.
- [ ] 4. After a recheck, read its verdict. `clean`: every thread is resolved. `open`: address what is still open, then run a recheck again. `cap`: the second recheck left threads open; they stay on the PR for the user.

The workflow runs six readers from [references/standards-brief.md](references/standards-brief.md), [references/spec-brief.md](references/spec-brief.md), [references/correctness-brief.md](references/correctness-brief.md), [references/provenance-brief.md](references/provenance-brief.md), [references/tests-brief.md](references/tests-brief.md) and [references/simplicity-brief.md](references/simplicity-brief.md), after the evidence of [references/evidence-brief.md](references/evidence-brief.md) and before the verdict of [references/judge-brief.md](references/judge-brief.md); a recheck follows [references/recheck-brief.md](references/recheck-brief.md). The Standards reader always carries the baseline of [references/smells.md](references/smells.md).

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
- **Pre-flight** - the check of the commits before any reader starts: one action each, a why in each message, none carrying most of the diff.
- **Thread** - one review comment on a line of the diff, opened by the review and closed only by a recheck; its first line is a marker such as `[review F3 tests]`.
- **Recheck** - the small review that opens the source behind each open thread and the fix commits, and resolves, answers or reopens threads.
- **Judge** - the Opus agent that opens every cited source itself, drops what fails and writes the valid questions.
- **Standards** - the axis asking whether the diff follows the repo's documented code rules.
- **Spec** - the axis asking whether the diff does what the ticket asked, no more and no less.
- **Correctness** - the axis asking whether the diff has bugs, and whether code that reads right compiles and types right.
- **Provenance** - the axis asking where each new type, pattern, abstraction, dependency and file came from.
- **Tests** - the axis asking which Implementation criterion each new test proves.
- **Simplicity** - the axis asking what the smallest change meeting the criteria is, and where the diff is bigger.
- **Smell baseline** - twelve Fowler code smells the Standards axis always carries, each a judgement call.
