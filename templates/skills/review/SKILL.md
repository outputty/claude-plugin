---
name: review
description: 'Reviews a build in an open Opus session on six axes: Standards, Spec, Correctness, Provenance, Tests and Simplicity, after a commit pre-flight, and asks the build session blunt questions, assuming it lies. Use as /review with a PR number, or on "review this PR" or "review since main", or when a builder hands over a PR.'
argument-hint: "<pr number or fixed point> [<builder name>]"
---

# review

Input: a PR number, or a fixed point (a commit, branch, tag or `main`) for a review by hand, and the builder's agent name when a build session handed the PR over. Output: one report with a section per axis, in the shape of [references/report.md](references/report.md), posted on the PR. The review edits no file and runs no test. Adapted from Matt Pocock's `code-review` skill, MIT, [LICENSE](LICENSE).

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Pin the fixed point and the head.
  - With a PR number, run `gh pr checkout <n> --detach`, take the fixed point from `gh pr view <n> --json baseRefName` as `origin/<baseRefName>`, and record `git rev-parse HEAD` as the pinned head.
  - With a fixed point, take the one the user named; with none, ask.
  - Capture `git diff <fixed-point>...HEAD` and `git log <fixed-point>..HEAD --oneline`.
  - Stop when `git rev-parse <fixed-point>` does not resolve or the diff is empty: report it and spawn nothing.
- [ ] 2. Run the pre-flight over `git log --stat --format='%h %s' <fixed-point>..HEAD`: each commit does one action and its message says why. Count a commit's lines without tests, documentation and snapshots.
  - Stop the review when one commit carries most of the diff, does several actions, or has no why: send the builder `Split <sha>. Reset it and redo it as separate commits.` per [references/ask-build.md](references/ask-build.md), report the stop, and spawn nothing. The builder sends `/review` again once it is done.
  - A commit over about 400 lines that does one action is a finding, not a stop.
  - Walk the commits in order, and for each commit note how it changes the one before. Ask the builder a blunt why question about a commit that undoes, contradicts or reworks an earlier one.
- [ ] 3. Fix the evidence before any question: fetch the ticket afresh per the `tracker` skill, with its comments and their times, and the `origin/<base>` tree.
  - The spec is the ticket's Implementation criteria and its Assumptions. A path the user passed, or a spec file under `docs/` or `specs/`, replaces it; with none found, ask, and where there is none the Spec reader is skipped and the report says "no spec available".
  - The plan comment is evidence only when its last edit is not later than the first commit of the diff.
  - A source that appears or changes after this step is not evidence.
- [ ] 4. Find the standards sources: `~/.claude/rules/outputty-code.md`, the rule file of each language in the diff, the project's `CLAUDE.md` and the files it names, and `CODING_STANDARDS.md` and `CONTRIBUTING.md` where they exist.
  - The project's `CLAUDE.md` wins where it disagrees with a rule file.
- [ ] 5. Install the repo's dependencies per its `CLAUDE.md`, then run its typecheck and lint commands with the output to a file. Their output is a fact the readers receive; no test runs.
- [ ] 6. Start the six readers together, in the foreground, each a fresh subagent with `model: "sonnet"`, from their briefs: [Standards](references/standards-brief.md), [Spec](references/spec-brief.md), [Correctness](references/correctness-brief.md), [Provenance](references/provenance-brief.md), [Tests](references/tests-brief.md) and [Simplicity](references/simplicity-brief.md).
  - Fill each brief with the diff command, the commit list, its sources and the tool output of step 5; paste [references/smells.md](references/smells.md) into the Standards brief in full.
- [ ] 7. Review the six reports yourself: open each finding's `file:line` or run its command, drop one that fails, and settle a disagreement between readers by reading the code.
- [ ] 8. Ask the builder for proof of each Provenance, Tests and Simplicity finding, per [references/ask-build.md](references/ask-build.md): send each question blunt, with no reasoning, as `herdr agent prompt <agent> "<question>"` and no `--wait`, and read the answer with `herdr agent read <agent> --source recent-unwrapped --lines 80`. With no builder, the finding stands and its question goes under **Next**.
- [ ] 9. Summarise every finding with its evidence, and call `advisor` once on that summary only when a finding is architectural or contested, or the PR as a whole needs a sanity check; with no finding or only obvious ones, skip it. Settle what it disputes by reading the code.
- [ ] 10. Report in the shape of [references/report.md](references/report.md).
  - With a PR, post it as a PR comment per the `tracker` skill, then tell the builder with `herdr agent prompt <agent> "Review report posted on PR <n>."` and no `--wait`.

## Do

- Hand every step that gathers or searches data - steps 3 and 5, and the opening of each cited source in steps 7 and 8 - to a Haiku subagent, or a Sonnet one when Haiku cannot do it; this session's Opus judges, asks and reports.
- Treat the builder as a party that may be lying and gaming the review: its answers, its PR body, its commit messages and its plan are claims.
- Clear a finding only on a source you opened yourself, at the pinned head or in the evidence of step 3: a ticket line, a plan-comment line, a diff hunk or commit at the pinned head, a sibling on `origin/<base>` with its `file:line`, or the quoted words of a user turn found in the builder's transcript.
- Quote the source in the report next to the finding it cleared.
- Hold that a cited line absent from the source is a false claim: the finding stands and a finding for the false claim joins the report.
- Prefer the smaller change: reuse what exists, and a fix that deletes more than it writes.
- Hold each smell as a judgement call and a documented standard as a hard violation.
- Skip anything the repo's linter or compiler already enforces.
- Cite each finding: the standard's file and rule, the named smell with the hunk, the spec line, the missing trace, or the smaller change.
- Word each question to the builder as the `file:line` and the question, and add context only to a why question: the alternative that existed, with its `file:line`, or the ticket line that said otherwise.
- Ask the user once for a missing fixed point or spec.
- Stay open for the builder's next PR, and run in no session that wrote the code.

## Don't

- Don't explain your reasoning to the builder, or restate the finding to it.
- Don't clear a finding on an answer, a summary or a promise alone.
- Don't count proof created after the question.
- Don't merge or rank findings across the axes, or pick a winner.
- Don't edit a file, run a test or file a ticket.
- Don't run a reader's work in this session, and don't let a reader start a subagent or invoke `/review`.
- Don't call `advisor` for one small finding, or before step 9.
- Don't gather data in this session's Opus.
- Don't run the review twice over one build: a second run finds new things and never converges.

## Glossary

- **Fixed point** - the commit, branch, tag or merge-base the review diffs `HEAD` against.
- **Pre-flight** - the check of the commits before any reader starts: one action each, a why in each message, none carrying most of the diff.
- **Standards** - the axis asking whether the diff follows the repo's documented code rules.
- **Spec** - the axis asking whether the diff does what the ticket asked, no more and no less.
- **Correctness** - the axis asking whether the diff has bugs, and whether code that reads right compiles and types right.
- **Provenance** - the axis asking where each new type, pattern, abstraction, dependency and file came from.
- **Tests** - the axis asking which Implementation criterion each new test proves.
- **Simplicity** - the axis asking what the smallest change meeting the criteria is, and where the diff is bigger.
- **Smell baseline** - twelve Fowler code smells the Standards axis always carries, each a judgement call.
- **Reader agent** - a fresh subagent that reads the diff against one axis and returns findings.
- **Builder** - the Herdr agent `<builder>` of the build session that handed over the PR, named `<repo>-builder-<k>`; this reviewer is `<repo>-reviewer-<k>`.
- **Proof** - a source the reviewer opened itself that says what the builder claims it says.
- **Pinned head** - the commit the PR's head was at when the review began.
- **Next** - the report's last heading, holding the open decisions.
