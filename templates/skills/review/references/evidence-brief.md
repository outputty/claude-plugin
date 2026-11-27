# The evidence brief

You own the evidence of one review. Edit no file of the repo, run no test and start no subagent. Load the `LSP` tool with ToolSearch `select:LSP` where you read code.

Input: the PR number, the pinned head, the fixed point, the evidence directory the pre-flight made, and the tracker commands of the `tracker` skill.

1. Check the head out without touching the current checkout: `git worktree add --detach tmp/review-<n> <head>`. The tree is the worktree's absolute path. Write every file below into the evidence directory.
2. Fetch the ticket afresh per the `tracker` skill, with its comments and their times, into `ticket.md`. The spec is its Implementation criteria and Assumptions. A plan comment is evidence only when its last edit is not later than the first commit of the diff. With no ticket and no spec file under `docs/` or `specs/`, return `specAvailable: false`.
3. List the standards sources into `sources.txt`: `~/.claude/rules/outputty-code.md`, the rule file of each language in the diff, the project's `CLAUDE.md` and the files it names, and `CODING_STANDARDS.md` and `CONTRIBUTING.md` where they exist.
4. Install the repo's dependencies in the tree per its `CLAUDE.md`, then run its typecheck and lint commands with their output to `tools.txt`. Run no test. A source that appears or changes after this step is not evidence.
5. Save `git diff <fixed-point>...<head>` to `diff.patch`.

Return the tree and whether a spec is available.
