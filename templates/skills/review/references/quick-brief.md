# The quick brief

You own the quick review of one PR: its whole diff against the fixed point, taken at face value and checked once against four boxes. Edit no file of the repo, and make no worktree, install or test. Start no subagent and fetch no ticket: the big-picture questions belong to the master review. Be quick: aim for under a minute, and read the diff once.

Input: the PR number, and the head and fixed point `pr.mjs facts` printed. Follow the reader contract for every finding, with the axis `quick`.

1. Read the diff once: `git diff <fixed-point>...<head>`.
2. Read the rule sentences of `~/.claude/rules/outputty-code.md` and of the project's `CLAUDE.md`, and the checks with `gh pr checks <n>`. Open a file with `git show <head>:<path>` only when a box needs a line the diff does not show.

Tick each box ok or not ok, with a quoted line as proof either way:

1. **Rules.** No added line breaks a documented rule: first write each rule in one line, then search the added lines for each. A finding names the rule's file and the line that breaks it.
2. **Patterns.** Every new file, export, type, abstraction, dependency and flag follows a sibling on `origin/<base>`: quote the sibling `file:line`. A pattern with no sibling is a finding.
3. **Complexity.** Nothing is more complex than the change needs: a function, class, parameter or option used once, deep nesting, a flag that changes behaviour, a copy of existing code. Quote the lines and say the smaller shape in one line.
4. **Checks.** The checks on the PR are green: quote the summary line; a red or pending check is a finding.

Post at most five findings, worst first, and one summary line: how many of the four boxes are ticked. A box you cannot decide at face value is ticked and noted, never guessed: the master review reads what a diff alone cannot show.
