# The evidence brief

You gather the evidence of one review yourself, as the review subagent. Edit no file of the repo and run no test. Load the `LSP` tool with ToolSearch `select:LSP` where you read code.

Input: the PR number, and the head and fixed point `pr.mjs facts` printed. The evidence directory is `tmp/review-<n>-evidence/`; create it, and write `git log --no-merges --stat --format='%h %s%n%b' <fixed-point>..<head>` into its `commits.txt`. The tracker commands are in the `tracker` skill.

1. Check the head out without touching the current checkout, in the review's own worktree `tmp/review-<n>`: when it exists, move it with `git -C tmp/review-<n> checkout --detach <head>`; otherwise run `git worktree add --detach tmp/review-<n> <head>`. The tree is the worktree's absolute path. Write every file below into the evidence directory.
2. Fetch the ticket afresh per the `tracker` skill, with its comments and their times, into `ticket.md`. The spec is its Implementation criteria and Assumptions. A plan comment is evidence only when its last edit is not later than the first commit of the diff. With no ticket and no spec file under `docs/` or `specs/`, return `specAvailable: false`.
3. List the standards sources into `sources.txt`: `~/.claude/rules/outputty-code.md`, the rule file of each language in the diff, the project's `CLAUDE.md` and the files it names, and `CODING_STANDARDS.md` and `CONTRIBUTING.md` where they exist.
4. Install the repo's dependencies in the tree per its `CLAUDE.md`, then run its typecheck and lint commands with their output to `tools.txt`. Run no test. A source that appears or changes after this step is not evidence.
5. Save `git diff <fixed-point>...<head>` to `diff.patch`.

Return the tree and whether a spec is available.
