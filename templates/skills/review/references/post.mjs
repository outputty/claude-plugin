#!/usr/bin/env node
/**
 * Posts one review with one inline thread per finding, and prints the report the build reads.
 *
 * Usage: node post.mjs <pr> <findings.json>
 *
 * The file holds {head, letter, summary, findings, plan}.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoOf, run } from "./lib/github.mjs";
import { buildReviewPayload, postReport } from "./lib/review-payload.mjs";
import { print } from "./lib/print.mjs";

export function commandPost(pr, file) {
  const input = JSON.parse(readFileSync(file, "utf8"));
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
    report: postReport(input.findings, input.letter, input.plan || []),
  };
}

const [pr, file] = process.argv.slice(2);
if (!pr || !file) throw new Error("usage: post.mjs <pr> <findings.json>");
print(commandPost(pr, file));
