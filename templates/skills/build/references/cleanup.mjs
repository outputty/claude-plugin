#!/usr/bin/env node
/**
 * Removes the worktree and the evidence folders a PR's review left under tmp/.
 *
 * Usage: node cleanup.mjs <pr>
 *
 * Safe to run again: what is already gone is skipped.
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { hasWorktree, reviewPaths } from "./lib/review-leftovers.mjs";
import { print, run } from "./lib/shell.mjs";

const [pr] = process.argv.slice(2);
if (!pr) throw new Error("usage: cleanup.mjs <pr>");
const root = run("git", ["rev-parse", "--show-toplevel"]).trim();
const { worktree, prefix } = reviewPaths(root, pr);
const removed = [];
if (hasWorktree(run("git", ["worktree", "list", "--porcelain"]), worktree)) {
  run("git", ["worktree", "remove", "--force", worktree]);
  removed.push(worktree);
}
const tmp = join(root, "tmp");
// A repo that never ran a review has no tmp/, so there is nothing to remove there.
const leftovers = existsSync(tmp) ? readdirSync(tmp) : [];
for (const name of leftovers.filter((entry) => entry.startsWith(prefix))) {
  rmSync(join(tmp, name), { recursive: true, force: true });
  removed.push(join(tmp, name));
}
run("git", ["worktree", "prune"]);
print({ pr: Number(pr), removed });
