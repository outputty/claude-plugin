/** The decisions made from a PR's commits: the pre-flight stops, and whether a master review is advised. */
import { totalCodeLines } from "./diff.mjs";

/** The build's own commit limit: a commit over it holds more than one action's worth of code lines. */
export const MAX_COMMIT_CODE_LINES = 400;

export function isBlob(commit) {
  return commit.codeLines > MAX_COMMIT_CODE_LINES;
}

/** The pre-flight: the commits over the commit limit, and those whose message has no body. */
export function preflightStops(commits) {
  const blobs = commits.filter(isBlob).map((commit) => commit.sha);
  const noWhy = commits.filter((commit) => !commit.hasBody).map((commit) => commit.sha);
  const reasons = [];
  if (blobs.length) reasons.push("is over " + MAX_COMMIT_CODE_LINES + " code lines: " + blobs.join(", "));
  if (noWhy.length) reasons.push("message has no why in its body: " + noWhy.join(", "));
  return { shas: [...new Set([...blobs, ...noWhy])], reason: reasons.join("; ") };
}

/** What the build reads after a pre-flight stop. */
export function stopReport(stops) {
  return {
    report: "Pre-flight stopped the review: " + stops.reason,
    next: "Split these commits: reset each, redo it as separate commits each with its why in the message body, push, then start the review again.",
  };
}

/** A one-PR change under every one of these limits does not need the master review on its own. */
export const MASTER_LIMITS = { codeLines: 80, testFiles: 3, filesAdded: 2, newExports: 2 };

/** The reasons a one-PR ticket is advised the master review; none means the quick review and a full test run can do. */
export function masterReasons(commits, facts) {
  const codeLines = totalCodeLines(commits);
  const reasons = [];
  if (codeLines >= MASTER_LIMITS.codeLines) reasons.push(codeLines + " code lines");
  if (facts.testFiles > MASTER_LIMITS.testFiles) reasons.push(facts.testFiles + " test files changed");
  if (facts.filesAdded > MASTER_LIMITS.filesAdded) reasons.push(facts.filesAdded + " files added");
  if (facts.newExports > MASTER_LIMITS.newExports) reasons.push(facts.newExports + " new exports");
  if (facts.newDependencies) reasons.push("a new dependency");
  return reasons;
}

/** The master review ignores the stops: its commits were already checked layer by layer. */
export function applyMaster(facts) {
  return {
    ...facts,
    stops: { shas: [], reason: "" },
  };
}
