#!/usr/bin/env node
/**
 * Lists each path a ticket names as changed, unchanged or gone on origin/main since the ticket was drafted.
 *
 * Usage: node drift.mjs <ticket> [--base <branch>]
 *
 * Why it exists: the build checks every premise against current main before editing, and the paths the plan read are
 * the first place a premise moves.
 */
import { parseArgs } from "node:util";
import { classifyPath, draftedAgainst, pathsIn } from "./lib/ticket-body.mjs";
import { print, run } from "./lib/shell.mjs";

const { positionals, values } = parseArgs({ allowPositionals: true, options: { base: { type: "string" } } });
const [ticket] = positionals;
if (!ticket) throw new Error("usage: drift.mjs <ticket> [--base <branch>]");
const base = values.base || "main";
const body = JSON.parse(run("gh", ["issue", "view", ticket, "--json", "body"])).body;
const drafted = draftedAgainst(body);
// Without a draft commit there is nothing to compare against, so the build reads the ticket's paths itself.
if (!drafted) {
  print({ ticket: Number(ticket), drafted: "", paths: [], note: "no Drafted against line" });
} else {
  run("git", ["fetch", "origin", base]);
  const exists = (path) => {
    try {
      run("git", ["cat-file", "-e", "origin/" + base + ":" + path]);
      return true;
    } catch {
      return false;
    }
  };
  const paths = pathsIn(body).map((path) => ({
    path,
    state: classifyPath(exists(path), run("git", ["diff", "--stat", drafted + "..origin/" + base, "--", path])),
  }));
  print({ ticket: Number(ticket), drafted, base, paths });
}
