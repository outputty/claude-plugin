# The recheck brief

A recheck settles the threads a review left open. It reviews no old code again. Edit no file of the repo, run no test and start no subagent. Only a recheck resolves or reopens a thread; the builder replies and never resolves.

## Gather

1. `gh pr view <n> --json headRefOid`, `git fetch origin pull/<n>/head`, then use the review's worktree `tmp/review-<n>`: when it exists, move it with `git -C tmp/review-<n> checkout --detach <headRefOid>`; otherwise run `git worktree add --detach tmp/review-<n> <headRefOid>`. The tree is the worktree's absolute path.
2. List every review thread of the PR with the commands of the `tracker` skill, with its `totalCount`, writing the result to a file and reading it ten threads at a time, so no output is cut. Keep each thread whose first comment starts with `[review`, replied to or not: its id, that first line as the marker, its path and line, whether it is resolved, and the finding and replies in order. Return `total`, GitHub's thread count, and `others`, the threads you did not keep; the kept threads plus `others` equal `total`.
3. Set `closedByReview` to true only when the thread holds a reply starting `[review closed`.
4. For each thread, `fixDiff` is `git diff <pinned head>..<head> -- <path>`, cut at 200 lines.

## Check threads

You own the threads you are given, at most ten, grouped by file and axis. Each file's diff since the pinned head is given once. Check each on its own; the builder may be lying: its replies are claims.

- Resolve it only when you open the source at the head and it shows the finding fixed, or a reply's pointer, once opened, shows the finding was wrong. Quote that source.
- A reply with no pointer, or whose pointer does not say what it claims, does not resolve it.
- Return one check per thread, each with its `id`, `resolved`, the one-line `reply` for the thread (`[review closed <marker>] <the quoted source>` or `[review open <marker>] <what is still wrong>`), and the `source`.

## Read the fixes

Read only the diff of the fix commits. Report a problem a fix introduced: a bug, an unplanned type, pattern or file, or a bigger change than the fix needed. Report at most five, each on a line the fix diff changed, and none about code the fix did not touch.
