#!/usr/bin/env node
/**
 * Pins a PR's head and prints its commits, the diff's counts, the pre-flight stops and the reasons a master review is advised.
 *
 * Usage: node facts.mjs <pr> <base> [master]
 *
 * Why it exists: a model never counts commits or code lines; this script does. In `master` mode the stops are ignored, because the commits were checked layer by layer.
 */
import { run } from "./lib/github.mjs";
import {
  countCodeLines,
  countNewExports,
  hasNewDependency,
  isCodePath,
  isDocPath,
  isTestPath,
  totalCodeLines,
} from "./lib/diff.mjs";
import { applyMaster, masterReasons, preflightStops, stopReport } from "./lib/preflight.mjs";
import { print } from "./lib/print.mjs";

export function commandFacts(pr, base) {
  const info = JSON.parse(run("gh", ["pr", "view", pr, "--json", "headRefOid"]));
  run("git", ["fetch", "origin", "pull/" + pr + "/head"]);
  run("git", ["fetch", "origin", base]);
  const head = info.headRefOid;
  const fixedPoint = run("git", ["rev-parse", "origin/" + base]).trim();
  const range = fixedPoint + "..." + head;
  const log = run("git", ["log", "--no-merges", "--format=%H%x1f%s%x1f%b%x1e", fixedPoint + ".." + head]);
  const commits = log
    .split("\x1e")
    .filter((entry) => entry.trim())
    .map((entry) => {
      const [sha, subject, body] = entry.trim().split("\x1f");
      const numstat = run("git", ["show", "--numstat", "--format=", sha]);
      return {
        sha: sha.slice(0, 9),
        subject,
        hasBody: Boolean(body && body.trim()),
        codeLines: countCodeLines(numstat),
      };
    });
  const changed = run("git", ["diff", "--name-only", range]).split("\n").filter(Boolean);
  const added = run("git", ["diff", "--diff-filter=A", "--name-only", range]).split("\n").filter(Boolean);
  const codeFiles = changed.filter(isCodePath);
  const codeDiff = codeFiles.length ? run("git", ["diff", range, "--", ...codeFiles]) : "";
  const manifests = changed.filter((path) => /(^|\/)package\.json$/.test(path));
  const manifestDiff = manifests.length ? run("git", ["diff", range, "--", ...manifests]) : "";
  const facts = {
    filesAdded: added.length,
    testFiles: changed.filter(isTestPath).length,
    docFiles: changed.filter(isDocPath).length,
    newExports: countNewExports(codeDiff),
    newDependencies: hasNewDependency(manifestDiff),
  };
  return {
    pr,
    head,
    fixedPoint,
    commits,
    facts,
    codeLines: totalCodeLines(commits),
    stops: preflightStops(commits),
    masterAdvised: masterReasons(commits, facts),
  };
}

function describeFacts(facts, mode) {
  // The master review ignores the stops: its commits were already checked layer by layer.
  if (mode === "master") return applyMaster(facts);
  // A stop tells the build what to split, in the same report shape as a review.
  if (facts.stops.shas.length) return { ...facts, ...stopReport(facts.stops) };
  return facts;
}

const [pr, base, mode] = process.argv.slice(2);
if (!pr || !base) throw new Error("usage: facts.mjs <pr> <base> [master]");
print(describeFacts(commandFacts(pr, base), mode));
