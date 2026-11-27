# The recheck brief

A recheck settles the threads a review left open. It reviews no old code again. Edit no file of the repo and run no test. Only a recheck closes or reopens a thread; the builder replies and never resolves.

## Check threads

You own the threads you are given. Use the review's worktree `tmp/review-<n>`: when it exists, move it with `git -C tmp/review-<n> checkout --detach <head>`; otherwise run `git worktree add --detach tmp/review-<n> <head>`. Check each thread on its own; the builder may be lying: its replies are claims. The diff of a file since the pinned head is `git diff <pinned head>..<head> -- <path>`.

- Close it only when you open the source at the head and it shows the finding fixed, or a reply's pointer, once opened, shows the finding was wrong. Quote that source: `node settle.mjs close <thread id> "<tag>" "<the quoted source>"`.
- A reply with no pointer, or whose pointer does not say what it claims, does not close it: `node settle.mjs keep <thread id> "<tag>" "<what is still wrong>"`.
- A thread the builder resolved, which shows `resolved by the builder`: `node settle.mjs reopen <thread id> "<tag>"`, then check it like any other.
- Settle every thread you are given. Return one line per thread: its tag, and closed, kept or reopened.

## Read the fixes

Read only the diff of the fix commits, `git diff <pinned head>..<head>`. Report a problem a fix introduced: a bug, an unplanned type, pattern or file, or a bigger change than the fix needed. Report at most three, each on a line the fix diff changed, and none about code the fix did not touch. Post them with `node post.mjs <n> <file>` and the letter `N`.
