---
name: review
description: "Reviews a build's PR with a review subagent the build session starts: a script pre-flight, a lite checklist or up to three Haiku readers over six axes, the subagent as judge with the advisor, and one GitHub thread per finding; a recheck closes the threads that are fixed, and a docs check runs after the docs layer. Use as /review with a PR number, or when a build hands over a PR."
argument-hint: "<pr number> [recheck <round>]"
---

# review

Input: a PR number, its base branch, a mode (`review`, `recheck` or `docs`) and, for a recheck, the round. Output: a report the build prints, one line per thread, and a next step. The review edits no file of the repo and runs no test.

## Steps

The build starts the review subagent; the subagent runs the rest. Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. The build starts the `outputty:review` subagent with the Agent tool, whose prompt is only `mode <mode>, PR <n>, base <branch>, round <k>` and nothing else from its own session. The agent definition preloads this skill, so the subagent reads no file to start and the builder cannot edit its review. Each run is a new subagent with an empty context.
- [ ] 2. Mode `review` and `docs`: run `node <skills dir>/outputty-review/references/pr.mjs facts <n> <base>`, where the skills dir is `~/.claude/skills` as an absolute path, never the PR's worktree: it pins the head and prints the commits, the counts, the stops and the depth. When `stops.shas` is not empty, return its `report` and `next` and stop.
- [ ] 3. Mode `review`, lite: read the whole diff against the parent once, tick the eight boxes of [references/lite-brief.md](references/lite-brief.md) yourself, and start no subagent.
- [ ] 4. Mode `review`, full: check the head out and gather the evidence per [references/evidence-brief.md](references/evidence-brief.md), then start the readers of the Do lines at once, in one message, each on Haiku and each given its axes' briefs, [references/reader-contract.md](references/reader-contract.md) and the evidence directory. The briefs are [references/standards-brief.md](references/standards-brief.md), [references/spec-brief.md](references/spec-brief.md), [references/correctness-brief.md](references/correctness-brief.md), [references/provenance-brief.md](references/provenance-brief.md), [references/tests-brief.md](references/tests-brief.md) and [references/simplicity-brief.md](references/simplicity-brief.md). Skip an axis with nothing to read, and list it under Not run: Standards and Correctness without code lines, Spec without a spec, Tests without a spec or a test file, Provenance without an added file, export or dependency, and Simplicity under 30 code lines.
- [ ] 5. Judge the findings yourself per [references/judge-brief.md](references/judge-brief.md): open every cited source, drop what fails, and consult `advisor` once.
- [ ] 6. Write the surviving findings to `tmp/review-<n>-findings.json` as `{head, letter, summary, findings}`, each finding `{axis, file, line, claim, evidence, rule, question}` with `line` a line the diff changed and `rule` and `question` optional, with the letter `F` and the summary in the shape of [references/report.md](references/report.md), then run `node <skills dir>/outputty-review/references/pr.mjs post <n> tmp/review-<n>-findings.json`. Remove the evidence directory, and keep the worktree `tmp/review-<n>` for the recheck.
- [ ] 7. Mode `docs`: gather the evidence without an install, read the docs per [references/docs-brief.md](references/docs-brief.md) yourself, judge, and post with the letter `D`.
- [ ] 8. Mode `recheck`: run `pr.mjs threads <n>`, which lists every review thread against GitHub's own count and gives the head the review read. Check each thread that is open, or resolved by the builder, per [references/recheck-brief.md](references/recheck-brief.md), and settle it with `pr.mjs close`, `keep` or `reopen`. Past ten such threads, start one checker per ten, grouped by file.
- [ ] 9. Mode `recheck`: read the diff of the fix commits for a problem a fix introduced, post at most three new findings with the letter `N`, then run `pr.mjs status <n> <round>`.
- [ ] 10. Return the `report` and `next` the script printed as your final message, and nothing else.

## Do

- Start a subagent only where a clean context or parallel reading pays for it: at most three readers in a full review (Standards with Simplicity, Spec with Tests and Provenance, Correctness), and at most one checker per ten threads in a recheck.
- Close a thread only with `pr.mjs close`, after you opened the source at the head and it shows the finding fixed, or a reply's pointer shows the finding wrong. Quote that source in the reply.
- Settle every open thread in a recheck: `close` it, or `keep` it with what is still wrong. A thread you leave unsettled is a defect of the recheck.
- Reopen a thread the builder resolved without the review's closing reply, then check it like any other.
- Address every thread as the builder: a fix commit and a one-line reply with its `file:line` pointer, or a reply whose pointer shows the finding is wrong. The reply is the answer to a question the judge asked.
- Run one review per PR and at most two rechecks.
- Tell the user the count of threads still open when a recheck returns `cap`.

## Don't

- Don't start a subagent for the judge, the lite checklist, the docs check, the post or any `pr.mjs` command.
- Don't list, count or post threads by hand: `pr.mjs` does, and fails when GitHub's count differs.
- Don't resolve, close or reopen a thread from the build session: only a recheck does.
- Don't post the review from the build session: only the review subagent posts.
- Don't ask the builder a question outside a thread.
- Don't run the review again after it posted its threads.
- Don't treat a thread as addressed because the builder said so: the recheck opens the source.
- Don't add more than three new threads in a recheck, or any on a line the fixes did not change.

## Glossary

- **Fixed point** - the commit the review diffs the PR head against: `origin/<base>`.
- **Pre-flight** - the check, in `pr.mjs`, of the commits before any reader starts: none is over 400 code lines, and each message has a body that says why; whether a commit does one action is the judge's call.
- **Thread** - one review comment on a line of the diff, opened by the review and closed only by a recheck; its first line is a marker such as `[review F3 tests]`.
- **Lite** - the review of a small change: the review subagent ticks eight boxes over the whole diff itself, under 80 code lines with at most 3 test files, 2 files added, 2 new exports and no new dependency.
- **Recheck** - the small review that opens the source behind each open thread and the fix commits, and closes, answers or reopens threads.
- **Judge** - the review subagent's own pass: it opens every cited source, drops what fails, writes the valid questions and consults the advisor once when a finding is architectural or contested.
- **Docs** - the check, run after the six axes and the docs layer, asking whether the documentation matches what the diff changed.
- **Standards** - the axis asking whether the diff follows the repo's documented code rules.
- **Spec** - the axis asking whether the diff does what the ticket asked, no more and no less.
- **Correctness** - the axis asking whether the diff has bugs, and whether code that reads right compiles and types right.
- **Provenance** - the axis asking where each new type, pattern, abstraction, dependency and file came from.
- **Tests** - the axis asking which Implementation criterion each new test proves.
- **Simplicity** - the axis asking what the smallest change meeting the criteria is, and where the diff is bigger.
- **Smell baseline** - twelve Fowler code smells the Standards axis always carries, each a judgement call, in [references/smells.md](references/smells.md).
