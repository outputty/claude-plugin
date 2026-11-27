# The pre-flight brief

You own the pre-flight facts of one review. Edit no file of the repo, and make no worktree, install or test. Start no subagent. Be quick: you run before anything else.

Input: the PR number and its base branch.

1. Pin the head without touching the current checkout: `gh pr view <n> --json headRefOid,baseRefName`, then `git fetch origin pull/<n>/head <base>`. The fixed point is `origin/<base>`. Fail with the reason when `git rev-parse <fixed-point>` does not resolve or `git diff <fixed-point>...<head> --stat` is empty.
2. Create `tmp/review-<n>-evidence/` and write the commits into `commits.txt` there: `git log --no-merges --stat --format='%h %s%n%b' <fixed-point>..<head>`.
3. Count the diff's facts with `git diff <fixed-point>...<head>`: `filesAdded` (`--diff-filter=A --name-only`), `testFiles` and `docFiles` (changed files that are tests, or documentation under `docs/` or `*.md`), `newExports` (added lines that begin with `export`, `pub ` or `def ` of a public name) and `newDependencies` (true when a package manifest, such as `package.json`, `go.mod`, `Cargo.toml` or `pyproject.toml`, gained a dependency).
4. Return the head, the fixed point, the evidence directory, the facts, and one entry per commit: its sha, its subject, whether its message has a body, and its code lines, which are the added and deleted lines of `git show --numstat` without tests, documentation and snapshots. Judge nothing: the script decides from these numbers.
