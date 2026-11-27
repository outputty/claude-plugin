---
name: review
description: "Reviews a build's PR with a review subagent the build session starts: a quick review of every PR, at face value against the code rules, and once per ticket a master review of the whole ticket with readers, a judge and a revisit of the plan; one GitHub thread per finding, a recheck that closes the threads that are fixed, and a docs check after the docs layer. Use as /review with a PR number, or when a build hands over a PR."
argument-hint: "<pr number> [recheck <round>]"
---

# review

Input: a PR number, its base branch, a mode (`review`, `recheck`, `docs` or `master`) and, for a recheck, the round. Output: a report the build prints, one line per thread, and a next step. The review edits no file of the repo and runs no test.

## Steps

The build starts the review subagent; the subagent runs the rest. Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. The build starts the `outputty:review` subagent with the Agent tool, whose prompt is only `mode <mode>, PR <n>, base <branch>, round <k>` and nothing else from its own session. The agent definition preloads this skill, so the subagent reads no file to start and the builder cannot edit its review. Each run is a new subagent with an empty context.
- [ ] 2. Mode `review`, `docs` and `master`: run `node <skills dir>/outputty-review/references/pr.mjs facts <n> <base>`, with `master` added as a third argument in mode master, where the skills dir is `~/.claude/skills` as an absolute path, never the PR's worktree: it pins the head and prints the commits, the counts, the stops and `masterAdvised`. When `stops.shas` is not empty, return its `report` and `next` and stop.
- [ ] 3. Mode `review`, the quick review: read the whole diff against the fixed point once and answer the boxes of [references/quick-brief.md](references/quick-brief.md) yourself, at face value: fetch no ticket, check out no worktree and start no subagent. Aim for under a minute.
- [ ] 4. Mode `master`: check the head out and gather the evidence per [references/evidence-brief.md](references/evidence-brief.md), then start the readers of the Do lines at once, in one message, each on Haiku and each given its axes' briefs, [references/reader-contract.md](references/reader-contract.md), [references/master-brief.md](references/master-brief.md) and the evidence directory. The briefs are [references/standards-brief.md](references/standards-brief.md), [references/spec-brief.md](references/spec-brief.md), [references/correctness-brief.md](references/correctness-brief.md), [references/provenance-brief.md](references/provenance-brief.md), [references/tests-brief.md](references/tests-brief.md) and [references/simplicity-brief.md](references/simplicity-brief.md). Skip an axis with nothing to read, and list it under Not run: Standards and Correctness without code lines, Spec without a spec, Tests without a spec or a test file, Provenance without an added file, export or dependency, and Simplicity under 30 code lines.
- [ ] 5. Mode `master`: judge the findings yourself per [references/judge-brief.md](references/judge-brief.md): open every cited source, drop what fails, and consult `advisor` once. Then revisit the plan per [references/master-brief.md](references/master-brief.md); a plan-level finding is not a thread.
- [ ] 6. Write the surviving findings to `tmp/review-<n>-findings.json` as `{head, letter, summary, findings, plan}`, each finding `{axis, file, line, claim, evidence, rule, question}` with `line` a line the diff changed and `rule` and `question` optional, and `plan` a list of `{claim, evidence}` that is empty outside mode master, with the letter `F` and the summary in the shape of [references/report.md](references/report.md), then run `node <skills dir>/outputty-review/references/pr.mjs post <n> tmp/review-<n>-findings.json`. In mode master remove the evidence directory, and keep the worktree `tmp/review-<n>` for the recheck.
- [ ] 7. Mode `docs`: gather the evidence without an install, read the docs per [references/docs-brief.md](references/docs-brief.md) yourself, judge, and post with the letter `D`.
- [ ] 8. Mode `recheck`: run `pr.mjs threads <n>`, which lists every review thread against GitHub's own count and gives the head the review read. Check each thread that is open, or resolved by the builder, per [references/recheck-brief.md](references/recheck-brief.md), and settle it with `pr.mjs close`, `keep` or `reopen`. Past ten such threads, start one checker per ten, grouped by file.
- [ ] 9. Mode `recheck`: read the diff of the fix commits for a problem a fix introduced, post at most three new findings with the letter `N`, then run `pr.mjs status <n> <round>`.
- [ ] 10. Return the `report` and `next` the script printed as your final message, and nothing else.

## Do

- Keep the two reviews apart. The quick review takes the code at face value against the documented rules: a rule broken, a pattern invented, a complexity nothing justifies. The master review asks the big-picture questions of the whole ticket: whether it is correct, whether it meets its criteria, whether the plan still makes sense.
- Start a subagent only where a clean context or parallel reading pays for it: at most three readers in a master review (Standards with Simplicity, Spec with Tests and Provenance, Correctness), and at most one checker per ten threads in a recheck. The quick review starts none.
- Close a thread only with `pr.mjs close`, after you opened the source at the head and it shows the finding fixed, or a reply's pointer shows the finding wrong. Quote that source in the reply.
- Settle every open thread in a recheck: `close` it, or `keep` it with what is still wrong. A thread you leave unsettled is a defect of the recheck.
- Reopen a thread the builder resolved without the review's closing reply, then check it like any other.
- Address every thread as the builder: a fix commit and a one-line reply with its `file:line` pointer, or a reply whose pointer shows the finding is wrong. The reply is the answer to a question the judge asked.
- Run one review per PR. Run a recheck only when `status` says `open`: a fix or a reply landed on a thread since the last round. On `idle`, start none.
- Run the master review once per ticket, after its last PR and its docs layer. A ticket of several PRs or layers always gets it. A ticket of one PR gets it when `masterAdvised` lists a reason or the build judges the change reaches past its own files; a very small, self-contained ticket gets the quick review and a full run of the project's checks instead.
- Name a thread that waits on the user's answer, in the report, as waiting.

## Don't

- Don't start a subagent for the quick review, the judge, the docs check, the post or any `pr.mjs` command.
- Don't list, count or post threads by hand: `pr.mjs` does, and fails when GitHub's count differs.
- Don't resolve, close or reopen a thread from the build session: only a recheck does.
- Don't post the review from the build session: only the review subagent posts.
- Don't ask the builder a question outside a thread.
- Don't run the review again after it posted its threads.
- Don't treat a thread as addressed because the builder said so: the recheck opens the source.
- Don't add more than three new threads in a recheck, or any on a line the fixes did not change.
- Don't judge the ticket, its criteria or its plan in a quick review: that is the master review's work.

## Glossary

- **Fixed point** - the commit the review diffs the PR head against: `origin/<base>`.
- **Pre-flight** - the check, in `pr.mjs`, of the commits before any review starts: none is over 400 code lines, and each message has a body that says why; whether a commit does one action is the judge's call.
- **Thread** - one review comment on a line of the diff, opened by the review and closed only by a recheck; its first line is a marker such as `[review F3 tests]`.
- **Quick review** - the review of every PR: the review subagent reads the diff at face value and answers a few boxes about the code rules, invented patterns and unjustified complexity, in about a minute.
- **Master review** - the review of the whole ticket, once, after its last PR and its docs layer: readers over the six axes, the judge, and a revisit of the plan; a stack ticket reviews a draft PR that shows the whole diff.
- **Plan revisit** - the master review's question of whether the ticket's solution still makes sense given what exists and the other open tickets; a finding there becomes a `needs-planning` ticket, not a thread.
- **Recheck** - the small review that opens the source behind each open thread and the fix commits, and closes, answers or reopens threads.
- **Judge** - the review subagent's own pass in a master review: it opens every cited source, drops what fails, writes the valid questions and consults the advisor once when a finding is architectural or contested.
- **Docs** - the check, run after the docs layer, asking whether the documentation matches what the diff changed.
- **Standards** - the axis asking whether the diff follows the repo's documented code rules.
- **Spec** - the axis asking whether the diff does what the ticket asked, no more and no less.
- **Correctness** - the axis asking whether the diff has bugs, and whether code that reads right compiles and types right.
- **Provenance** - the axis asking where each new type, pattern, abstraction, dependency and file came from.
- **Tests** - the axis asking which Implementation criterion each new test proves.
- **Simplicity** - the axis asking what the smallest change meeting the criteria is, and where the diff is bigger.
- **Smell baseline** - twelve Fowler code smells the Standards axis always carries, each a judgement call, in [references/smells.md](references/smells.md).
