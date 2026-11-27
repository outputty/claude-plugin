/** The worktree and folders a review leaves under tmp/ for one PR. */

/** The worktree path of PR `pr`'s review, and the glob prefix of its evidence folders. */
export function reviewPaths(root, pr) {
  return { worktree: root + "/tmp/review-" + pr, prefix: "review-" + pr + "-" };
}

/** True when the output of `git worktree list --porcelain` lists a worktree at `path`. */
export function hasWorktree(porcelain, path) {
  return porcelain.split("\n").some((line) => line === "worktree " + path);
}
