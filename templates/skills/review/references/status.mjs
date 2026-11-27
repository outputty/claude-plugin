#!/usr/bin/env node
/**
 * Prints the report of a PR's review threads and the verdict: clean, idle or open.
 *
 * Usage: node status.mjs <pr> <round> <steps.json>
 *
 * The file holds {mode, steps}, the steps the recheck took, each {step, did, evidence}.
 */
import { listThreads } from "./lib/list-threads.mjs";
import { readFileSync } from "node:fs";
import { repoRoot } from "./lib/excerpt.mjs";
import { openWork } from "./lib/open-work.mjs";
import { renderSteps, missingSteps } from "./lib/steps.mjs";
import { renderStatus } from "./lib/verdict.mjs";
import { print } from "./lib/print.mjs";
import { renderFinding, summarizeWork } from "./lib/work-summary.mjs";

function commandStatus(pr, round, recheck) {
  const missing = missingSteps(recheck.mode, recheck.steps || []);
  // A recheck that shows no evidence for a step it must take reports nothing, so the build never reads it as done.
  if (missing.length) throw new Error("steps not shown with a did and an evidence: " + missing.join(", "));
  const { head, threads } = listThreads(pr);
  const status = renderStatus(threads, Number(round));
  const left = openWork(threads, head, repoRoot());
  const report = [
    "Steps taken:",
    ...renderSteps(recheck.steps),
    summarizeWork(left),
    ...left.map((finding) => renderFinding(finding, finding.tag)),
    status.text,
  ].join("\n");
  return { verdict: status.verdict, open: status.open, report };
}

const [pr, round, stepsFile] = process.argv.slice(2);
if (!pr || !round || !stepsFile) throw new Error("usage: status.mjs <pr> <round> <steps.json>");
print(commandStatus(pr, round, JSON.parse(readFileSync(stepsFile, "utf8"))));
