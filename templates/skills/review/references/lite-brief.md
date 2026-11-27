# The lite brief

You own the lite review of one PR: its whole diff against the parent branch, checked once against eight boxes. Edit no file of the repo, and make no worktree, install or test. Start no subagent: you read it yourself. Be quick: aim for under a minute, and read the diff once.

Input: the PR number, and the head and fixed point `pr.mjs facts` printed. The tracker commands are in the `tracker` skill. Follow the reader contract for every finding.

1. Read the diff once: `git diff <fixed-point>...<head>`.
2. Fetch the ticket once, with its comments, per the `tracker` skill. Its Implementation criteria and Assumptions are the spec. With no ticket, tick boxes 3 and 5 as ok and quote "no spec available".
3. Read the checks with `gh pr checks <n>`, and the rule sentences of `~/.claude/rules/outputty-code.md` and the project's `CLAUDE.md`.
4. Open a file with `git show <head>:<path>` only when a box needs a line the diff does not show.

Tick each box ok or not ok, with a quoted line as proof either way:

1. Every file, export, type, dependency and flag the diff adds traces to a ticket line or to a sibling on `origin/<base>`. Quote the line; a finding for each addition that traces to none.
2. Nothing the diff removes goes without a ticket line or a named replacement.
3. Every Implementation criterion has code and a test that asserts its example output: quote both `file:line`.
4. Every test the diff adds or changes proves a criterion.
5. The diff adds no behaviour that no criterion asks for.
6. The checks on the PR are green: quote the summary line; a red or pending check is a finding.
7. No added line breaks a documented rule: first write each rule in one line, then search the added lines for each.
8. No new abstraction has a single call site: a function, class, parameter or option used once.

Keep the boxes (`id`, `ok`, `quote`), one finding for each box that is not ok in the shape of the contract with the axis `lite`, and one summary line: how many of the eight boxes are ticked. Post them as the review's findings.
