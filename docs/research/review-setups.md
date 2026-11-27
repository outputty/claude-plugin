# How people review Claude-written code, and what stays when it is simplified

The question: which setup gives a reliable, adversarial review of anything a Claude 5 model implemented, from a fresh context, as fast and as simply as possible, and are small commits needed for it. Findings are read from the sources on 2026-11-27; each carries its kind, **MEASUREMENT** (a figure) or **REPORT** (a write-up), and how to validate it: open the URL and find the quote. A search of each source page found the key phrase of every quote below; the figures around a quote are as the research agents read them. Almost no measurement names a Claude 5 model; where a finding's models are older or unnamed, it says so.

## Setups people run

- **Local `/code-review`.** REPORT. A background subagent in its own context; an effort level trades confidence for coverage. Source: <https://code.claude.com/docs/en/code-review-local>. Quote: "At `low`, the review reports the findings it's most confident in". The page names no model and no cost.
- **`/code-review ultra`.** MEASUREMENT (vendor-stated). A cloud fleet, about 5 to 15 minutes, after 3 free runs "typically $5 to $25 in usage credits". Every finding is "independently reproduced and verified". Source: <https://code.claude.com/docs/en/ultrareview>.
- **Managed Code Review on GitHub.** MEASUREMENT (vendor, internal, March 2026, model unnamed). Finds, verifies, ranks, posts; three levels (Quick, Standard, Deep) and "its admin settings don't offer a model choice". Average "$15–25" and about 20 minutes. Substantive comments on PRs went from 16% to 54%, and "less than 1% of findings are marked incorrect" (an engineer's click, not a catch rate). Sources: <https://code.claude.com/docs/en/code-review>, <https://claude.com/resources/articles/code-review>, <https://code.claude.com/docs/en/code-review-costs> ("no flat per-review price").
- **`REVIEW.md` is read from the base branch only.** REPORT: "never from the pull request's own changes", so a PR cannot loosen its own review rules. Source: <https://code.claude.com/docs/en/code-review>.
- **A review is not a gate.** REPORT: "By itself, a review doesn't approve or block your pull request". Claude Approvals (`.claude/approvals.yml`) turns a review result into approval seats; a classifier run is capped at $10 by default. Sources: <https://code.claude.com/docs/en/code-review-pull-requests>, <https://code.claude.com/docs/en/approvals-setup>, <https://code.claude.com/docs/en/approvals-classifiers>.
- **The documented writer and reviewer pattern is a second session or subagent.** REPORT: "A fresh reviewer does help, because it hasn't seen your reasoning", and a subagent gives "parallelism or a fresh pair of eyes", not "a smarter answer". Source: <https://code.claude.com/docs/en/best-practices>.
- **The GitHub Action runs one prompt.** REPORT: "Without this argument, the Claude Code GitHub Action uses the Claude Code default model". Source: <https://code.claude.com/docs/en/github-actions>.
- **A review subagent is read-only only if its tool list omits Bash.** REPORT: "It can still change files through Bash." Source: <https://code.claude.com/docs/en/sub-agents>.
- **A public adversarial skill runs three personas and a cross-review round.** REPORT. `addyosmani/adverse`; its README says a single model playing three personas has "anchoring bias". No cost, time or catch rate. Source: <https://github.com/addyosmani/adverse>.
- **Cloudflare's production reviewer uses specialist subagents per merge request, sized by diff.** REPORT: "Cost scales with diff size"; $0.20 for trivial reviews and $1.68 for full ones, on Opus 4.7 and Sonnet 4.6. Source: <https://blog.cloudflare.com/ai-code-review> (2026-04-20).

## What makes a review reliable

- **Fresh context beats a second review in the author's session.** MEASUREMENT. F1 28.6% fresh against 21.7% same-session; 30 artifacts, 150 planted errors, models unnamed. The fresh session is not significantly ahead of a context-aware subagent (p=0.057). Source: <https://arxiv.org/abs/2603.12123>.
- **A model is more lenient on an action it sees as its own.** MEASUREMENT. "monitors fail to report high-risk or low-correctness actions more often when evaluation follows a previous" turn. Models not read. Source: <https://arxiv.org/abs/2603.04582>.
- **A reviewer from another model finds partly different errors, not more.** MEASUREMENT. Cross-model review is "not significantly different in F1 from same-model review in a fresh session"; error overlap 41.2%. Source: <https://arxiv.org/abs/2610.01471>.
- **Claude 5.5 reviewers still accept about half of wrong patches at high effort.** MEASUREMENT. 90 agent-written Django patches: false success .45 (Opus 5.5), .49 (Sonnet 5.5), .51 (Haiku 5.5) at high effort, against .67, .65, .78 at low. Medium effort on Opus was within 15 points of high and 20% cheaper. Source: <https://arxiv.org/abs/2611.33639> (2026-11-25). One model reviewing alone: it says nothing about axes or votes.
- **Agreement is not evidence; a run check is.** REPORT. "ten dedicated reviewers unanimously endorsed a non-existent Bleichenbacher padding oracle"; a mandatory empirical gate and "kill" stages removed about 79% of 171 candidates. C and C++ vulnerability work, models unnamed. Source: <https://arxiv.org/abs/2604.19049>.
- **Neutral adversarial setups drift into consensus.** MEASUREMENT. "naive AR exposes a false-consensus failure mode"; one added instruction to disagree explicitly gave the best F1. Source: <https://arxiv.org/abs/2608.18167>.
- **Asking for explanations and fixes raises misjudgments of correct code.** MEASUREMENT. Running the model's own proposed fix as a test cut it. Source: <https://arxiv.org/abs/2603.00539>.
- **A reviewer told to find problems will find something.** REPORT: "A reviewer that's asked to find problems will always find something"; the documented prompt reviews against a spec and says "skip style". Source: <https://code.claude.com/docs/en/best-practices>.
- **A reviewer that cannot run tests can lower stronger drafts.** MEASUREMENT. Codex reviewing Claude drafts dropped the pass rate from 91.4% to 82.8%; Claude self-review left it unchanged. Claude version not stated. Source: <https://arxiv.org/abs/2607.21656>.
- **A review-then-fix loop can break correct code.** REPORT. Imbue's reviewer "found issues in 8" of 15 resolved tasks; a weaker fixer broke a test. "Opus" and "Sonnet", versions unnamed. Source: <https://imbue.com/blog/2026-04-29-how-ai-code-review-can-make-correct-code-worse>.

## Asking the author, and loops

- **A reviewer that questions the author did worse than one read-only pass.** MEASUREMENT. Single-pass F1 0.376 against 0.303 with question and answer; recall +0.08, false positives +62%, precision "from 0.30 to 0.20". Models unnamed. Source: <https://arxiv.org/abs/2603.16244>. Anthropic's managed review describes no author exchange.
- **A bounded loop can end unconverged.** REPORT. Three rounds and about half an hour left the central issue unresolved. Source: <https://www.contrastsecurity.com/security-influencers/when-ai-reviewers-cannot-agree> (2026-07-20). A second write-up relays Anthropic-internal figures, "mean reviews to pass from 2.08 to 1.32", and advises a cap of three rounds: <https://www.realaization.com/blog/four-rules-that-make-an-ai-review-loop-converge> (2026-10-23, second-hand).
- **A foreground subagent holds its parent's turn.** REPORT. Background subagents "surface every permission prompt in your main session" and wait. A completed subagent is resumed with `SendMessage`, which does not need agent teams. Source: <https://code.claude.com/docs/en/sub-agents>.
- **A message to an idle session starts a new turn.** REPORT: "When the receiving session is idle, Claude Code starts a new turn with the message"; a busy one reads it between tool calls. Source: <https://code.claude.com/docs/en/cross-session-messaging>.
- **Agent teams are experimental and can stall.** REPORT: "teammates sometimes fail to mark tasks as completed, which blocks dependent tasks". Source: <https://code.claude.com/docs/en/agent-teams>.
- **Stop-hook loops are capped at eight continuations and have burned quota.** REPORT. "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn" (<https://code.claude.com/docs/en/hooks>); one issue's loop "ran for ~50 minutes and consumed my entire session quota" (<https://github.com/anthropics/claude-code/issues/55754>, since closed; whether the bug persists is unchecked).

## Diff size and commit size

- **Reviewer F1 collapses as the diff grows.** MEASUREMENT. 0.657 under 10 lines, 0.043 over 150; on real PRs the best model scored F1 0.066 against 0.847 on synthetic ones. Haiku 4.5 and Sonnet 4.6, 150 samples, one prompt, vendor preprint. Source: <https://arxiv.org/html/2606.15689>. Its remedy is to split a large diff into per-function or per-hunk chunks.
- **Human attention thins with each file.** MEASUREMENT. Each extra file lowers the odds a file gets any comment by about 8.7%; across 330,343 PRs, risk was lowest at about 10 files and higher at both ends. Mostly pre-agent. Source: <https://arxiv.org/html/2609.22610>.
- **The 200 to 400 line rule.** REPORT: "beyond 400 LOC, the ability to find defects diminishes". A vendor page summarising an old study; the original was not opened. Source: <https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/>.
- **For stacked PRs: GitHub and a stacking vendor argue review quality falls with size.** REPORT. "Reviewers lose context and the feedback quality drops" (<https://github.blog/engineering/turn-one-giant-ai-generated-pull-request-to-a-reviewable-stack/>, 2026-08-04); "the unit of review is the commit" (<https://julien.danjou.info/blog/twenty-years-of-stacking-commits/>, author sells stacking). No measurements.
- **Against stacked PRs: Rootly dropped its small-PR rule.** REPORT. Agent-produced stacks were "technically correct but contextually worse". One company. Source: <https://rootly.com/blog/why-we-got-rid-of-our-small-pr-rule> (2026-05-20).
- **Production reviewers review the whole PR, not each commit.** REPORT. Anthropic's review works per PR and per push ("keep the earlier result" when the net diff is unchanged); Cloudflare reviews the merge request. Sources: <https://code.claude.com/docs/en/code-review-pull-requests>, <https://blog.cloudflare.com/ai-code-review>.
- **A region-focused reviewer beats comment-everywhere on large AI diffs.** MEASUREMENT. About 5x fewer tokens and 6x lower latency, "absolute precision and recall stay modest". Meta's Spotlight, 298 diffs. Source: <https://arxiv.org/html/2607.29516>.

## What stays unknown

- No measurement of any review setup on Claude 5 pull requests, and none of self-preference between Claude 5 reviewer and author. Almost every paper names no model or an older one.
- No head-to-head of one strong reviewer, several axis reviewers and a vote on real code.
- No test of an "assume the author cheats" prompt against a neutral one, or of file and line proof required against not required.
- No test of per-commit review against whole-PR review, and no Anthropic guidance on commit size.
- Whether a reusable Claude workflow run with ultracode suits a review was not researched.
- Whether a review that also checks the next tickets finds more was not researched.
- Which model the built-in reviews run on is not documented in any page read.

## Reading for /plan

Inference from the findings above, not a finding:

- **Fresh context:** a fresh-context subagent is supported; a second session is not needed (p=0.057 against a context-aware subagent).
- **Questions to the builder:** the only measurement says they hurt. Replace them with checks the reviewer runs on the sources: the diff, the ticket, the tests and the commit messages.
- **Adversarial and reliable:** require a source or a run for each finding, scope the prompt to the ticket's spec and tell it to skip style, and run anything runnable. Unanimous agreement does not count.
- **Several reviewers:** no evidence that axes beat one strong reviewer on Claude 5; same-model personas are correlated. A second model adds partly different findings.
- **Chunked commits:** the evidence supports small review units, because reviewer accuracy falls with diff size. It does not show that commit boundaries help, and production reviewers read the whole PR. A diff cap per review would carry the benefit.
- **Speed:** local review takes seconds to minutes; managed and ultra reviews take 5 to 20 minutes.
