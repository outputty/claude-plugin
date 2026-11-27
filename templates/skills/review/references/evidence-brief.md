# The evidence brief

You own the evidence of one review. Edit no file of the repo, run no test and start no subagent. Load the `LSP` tool with ToolSearch `select:LSP` where you read code.

Input: the PR number, its base branch, and the tracker commands of the `tracker` skill.

1. Pin the head without touching the current checkout: `gh pr view <n> --json headRefOid,baseRefName`, `git fetch origin pull/<n>/head <base>`, then `git worktree add --detach tmp/review-<n> <headRefOid>`. The fixed point is `origin/<base>`; the tree is the worktree's absolute path. Write every file below into `tmp/review-<n>-evidence/`.
2. Stop when `git rev-parse <fixed-point>` does not resolve or the diff is empty: return `preflight: "stop"`, no split commits and the reason.
3. Run the pre-flight over `git log --stat --format='%h %s' <fixed-point>..<head>`, written to `commits.txt`: each commit does one action and its message says why. Count a commit's lines without tests, documentation and snapshots.
   - Stop, with `preflight: "stop"`, the shas and the reason, when one commit carries most of the diff, does several actions, or has no why.
   - A commit over about 400 lines that does one action is a finding: mark it in `commits.txt`.
   - Walk the commits in order and mark each one that undoes, contradicts or reworks an earlier one.
4. Fetch the ticket afresh per the `tracker` skill, with its comments and their times, into `ticket.md`. The spec is its Implementation criteria and Assumptions. A plan comment is evidence only when its last edit is not later than the first commit of the diff. With no ticket and no spec file under `docs/` or `specs/`, return `specAvailable: false`.
5. List the standards sources into `sources.txt`: `~/.claude/rules/outputty-code.md`, the rule file of each language in the diff, the project's `CLAUDE.md` and the files it names, and `CODING_STANDARDS.md` and `CONTRIBUTING.md` where they exist.
6. Install the repo's dependencies in the tree per its `CLAUDE.md`, then run its typecheck and lint commands with their output to `tools.txt`. Run no test. A source that appears or changes after this step is not evidence.
7. Save `git diff <fixed-point>...<head>` to `diff.patch`.

Return the head, the fixed point, the tree, the evidence directory, whether a spec is available, the pre-flight result, the stopped shas and the reason.
