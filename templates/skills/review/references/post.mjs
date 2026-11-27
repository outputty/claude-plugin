#!/usr/bin/env node
/**
 * Posts one review with one inline thread per finding, and prints the report the build reads.
 *
 * Usage: node post.mjs <pr> <findings.json>
 *
 * The file holds {mode, head, letter, summary, findings, plan, steps}, each step {step, did, evidence}.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoOf, run } from "./lib/github.mjs";
import { buildReviewPayload, postReport } from "./lib/review-payload.mjs";
import { missingSteps } from "./lib/steps.mjs";
import { print } from "./lib/print.mjs";

export function commandPost(pr, file) {
  const input = JSON.parse(readFileSync(file, "utf8"));
  const missing = missingSteps(input.mode, input.steps || []);
  // A review that shows no evidence for a step it must take posts nothing, so the build never reads it as done.
  if (missing.length) throw new Error("steps not shown with a did and an evidence: " + missing.join(", "));
  const { owner, name } = repoOf();
  const payloadFile = join(tmpdir(), "review-payload-" + pr + ".json");
  writeFileSync(payloadFile, JSON.stringify(buildReviewPayload(input)));
  const out = JSON.parse(
    run("gh", [
      "api",
      "repos/" + owner + "/" + name + "/pulls/" + pr + "/reviews",
      "--method",
      "POST",
      "--input",
      payloadFile,
    ]),
  );
  return {
    url: out.html_url,
    posted: input.findings.length,
    report: postReport(input.findings, input.letter, input.plan || [], [
      ...input.steps,
      { step: 6, did: "posted the review", evidence: out.html_url },
    ]),
  };
}

const [pr, file] = process.argv.slice(2);
if (!pr || !file) throw new Error("usage: post.mjs <pr> <findings.json>");
print(commandPost(pr, file));
