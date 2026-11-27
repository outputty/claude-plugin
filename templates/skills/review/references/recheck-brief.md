# The recheck brief

A recheck settles the threads a review left open. It reviews no old code again. Edit no file of the repo, run no test and start no subagent. Only a recheck resolves or reopens a thread; the builder replies and never resolves.

## Gather

1. `gh pr view <n> --json headRefOid`, `git fetch origin pull/<n>/head`, then use the review's worktree `tmp/review-<n>`: when it exists, move it with `git -C tmp/review-<n> checkout --detach <headRefOid>`; otherwise run `git worktree add --detach tmp/review-<n> <headRefOid>`. The tree is the worktree's absolute path.
2. List the PR's review threads with the commands of the `tracker` skill. Keep each thread whose first comment starts with `[review`: its id, that first line as the marker, its path and line, whether it is resolved, and the finding and replies in order.
3. Set `closedByReview` to true only when the thread holds a reply starting `[review closed`.
4. For each thread, `fixDiff` is `git diff <pinned head>..<head> -- <path>`, cut at 200 lines.

## Check a thread

You own one thread. The builder may be lying: its replies are claims.

- Resolve it only when you open the source at the head and it shows the finding fixed, or a reply's pointer, once opened, shows the finding was wrong. Quote that source.
- A reply with no pointer, or whose pointer does not say what it claims, does not resolve it.
- Return `resolved`, the one-line `reply` for the thread (`[review closed <marker>] <the quoted source>` or `[review open <marker>] <what is still wrong>`), and the `source`.

## Read the fixes

Read only the diff of the fix commits. Report a problem a fix introduced: a bug, an unplanned type, pattern or file, or a bigger change than the fix needed. Report at most five, each on a line the fix diff changed, and none about code the fix did not touch.
