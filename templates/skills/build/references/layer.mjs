#!/usr/bin/env node
/**
 * Publishes a layer's branch as a PR, links a stack on GitHub, rebases a stack after a lower layer changed, and merges.
 *
 * Usage:
 *   node layer.mjs publish --base <base> [--below <branch>] [--stack] --title <title> --body-file <file>
 *   node layer.mjs restack --base <base> --top <branch> --changed <branch>
 *   node layer.mjs merge <pr> [--stack]     merges, then closes the ticket the PR's body closes
 *
 * Why it exists: a 29-layer stack was one hand-typed branch, push, PR and link per layer, and one stack was never linked.
 * Every command reads the state first and does only what is missing, so running it again is safe.
 */
import { parseArgs } from "node:util";
import { bottomBase, chainFrom, restackPlan } from "./lib/chain.mjs";
import { ticketClosedBy } from "./lib/closing.mjs";
import { print, run } from "./lib/shell.mjs";

const gh = (...args) => run("gh", args).trim();
const git = (...args) => run("git", args).trim();

function openPrs() {
  return JSON.parse(gh("pr", "list", "--state", "open", "--limit", "200", "--json", "number,headRefName,baseRefName"));
}

function publish(flags) {
  const branch = git("branch", "--show-current");
  git("push", "-u", "origin", "HEAD");
  const existing = openPrs().find((pr) => pr.headRefName === branch);
  const created = !existing;
  const number = existing
    ? existing.number
    : Number(
        gh(
          "pr",
          "create",
          "--base",
          flags.below || flags.base,
          "--head",
          branch,
          "--title",
          flags.title,
          "--body-file",
          flags["body-file"],
        )
          .split("/")
          .pop(),
      );
  const linked = [];
  if (flags.stack) {
    const chain = chainFrom(openPrs(), branch, flags.base);
    // A first layer alone is not a stack yet, so there is nothing to link.
    if (chain.length > 1) {
      linked.push(...chain.map((pr) => pr.number));
      gh("stack", "link", "--base", flags.base, ...linked.map(String));
    }
  }
  return { branch, pr: number, created, linked };
}

function restack(flags) {
  const start = git("branch", "--show-current");
  const plan = restackPlan(chainFrom(openPrs(), flags.top, flags.base), flags.changed);
  for (const step of plan) {
    git("switch", step.branch);
    git("rebase", step.onto);
    git("push", "--force-with-lease", "origin", step.branch);
  }
  git("switch", start);
  return { rebased: plan.map((step) => step.branch) };
}

/** Closes the ticket a merged PR finishes, which GitHub leaves open when the PR merged into a feature branch. */
function closeTicket(ticket, pr, target) {
  if (!ticket) return null;
  // A ticket already closed, by the merge itself or an earlier run, is left as it is.
  if (JSON.parse(gh("issue", "view", String(ticket), "--json", "state")).state === "CLOSED") return null;
  gh(
    "issue",
    "close",
    String(ticket),
    "--reason",
    "completed",
    "--comment",
    "Merged in #" + pr + " into " + target + ".",
  );
  return ticket;
}

function merge(number, flags) {
  const prs = openPrs();
  const top = prs.find((pr) => pr.number === Number(number));
  if (!top) throw new Error("PR " + number + " is not open");
  const target = flags.stack ? bottomBase(prs, top.headRefName) : top.baseRefName;
  const main = JSON.parse(gh("repo", "view", "--json", "defaultBranchRef")).defaultBranchRef.name;
  // Only the user, or the orchestrator on the user's word, merges into the default branch.
  if (target === main) throw new Error("refusing to merge into " + main + ": merge into a feature branch");
  const ticket = ticketClosedBy(JSON.parse(gh("pr", "view", String(number), "--json", "body")).body);
  if (flags.stack) gh("stack", "merge", String(number), "--yes");
  else gh("pr", "merge", String(number), "--merge");
  return { merged: Number(number), into: target, closed: closeTicket(ticket, number, target) };
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: "string" },
    below: { type: "string" },
    top: { type: "string" },
    changed: { type: "string" },
    title: { type: "string" },
    "body-file": { type: "string" },
    stack: { type: "boolean" },
  },
});
const [command, argument] = positionals;
if (command === "publish") print(publish(values));
else if (command === "restack") print(restack(values));
else if (command === "merge") print(merge(argument, values));
else throw new Error("usage: layer.mjs publish|restack|merge ...");
