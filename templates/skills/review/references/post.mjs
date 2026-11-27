#!/usr/bin/env node
/**
 * Posts one review with one inline thread per finding, and prints the report the build reads.
 *
 * Usage: node post.mjs <pr> <findings.json>
 *
 * The file holds {mode, head, letter, summary, findings, plan, steps}, each step {step, did, evidence}, each finding
 * {axis, file, line, claim, evidence, change, rule, question, test: {file, from, to}}; the script adds each finding's link, code and test source.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoOf, run } from "./lib/github.mjs";
import { buildReviewPayload, postReport } from "./lib/review-payload.mjs";
import { aroundLine, editorLink, fileAt, numberedLines, repoRoot } from "./lib/excerpt.mjs";
import { missingSteps } from "./lib/steps.mjs";
import { print } from "./lib/print.mjs";

const MAX_TEST_LINES = 40;

/** A finding with its editor link, the lines around it at the head, and its test's source when it names one. */
function withExcerpts(finding, head, root) {
  const shown = {
    ...finding,
    link: editorLink(root, finding.file, finding.line),
    snippet: aroundLine(fileAt(head, finding.file), finding.line),
  };
  if (!finding.test) return shown;
  const { file, from, to } = finding.test;
  return {
    ...shown,
    testLink: editorLink(root, file, from),
    testSource: numberedLines(fileAt(head, file), from, Math.min(to, from + MAX_TEST_LINES - 1)),
  };
}

function commandPost(pr, file) {
  const input = JSON.parse(readFileSync(file, "utf8"));
  const missing = missingSteps(input.mode, input.steps || []);
  // A review that shows no evidence for a step it must take posts nothing, so the build never reads it as done.
  if (missing.length) throw new Error("steps not shown with a did and an evidence: " + missing.join(", "));
  const unchanged = input.findings.filter((finding) => !finding.change?.trim());
  // A finding that does not say what to change leaves the build guessing how much work is left.
  if (unchanged.length)
    throw new Error(
      "findings with no change: " + unchanged.map((finding) => finding.file + ":" + finding.line).join(", "),
    );
  const root = repoRoot();
  const shown = input.findings.map((finding) => withExcerpts(finding, input.head, root));
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
    report: postReport(shown, input.letter, input.plan || [], [
      ...input.steps,
      { step: 6, did: "posted the review", evidence: out.html_url },
    ]),
  };
}

const [pr, file] = process.argv.slice(2);
if (!pr || !file) throw new Error("usage: post.mjs <pr> <findings.json>");
print(commandPost(pr, file));
