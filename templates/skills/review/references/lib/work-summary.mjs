/** What a review hands the build to read: how much work is left, and per finding its code, its link and its test. */
import { firstSentence } from "./thread.mjs";

const plural = (count, word) => count + " " + word + (count === 1 ? "" : "s");

/** "Work left: 3 things to change in 2 files (a.ts 2, b.ts 1); by axis: tests 2, spec 1", or that nothing is left. */
export function summarizeWork(findings) {
  if (findings.length === 0) return "Work left: nothing to change.";
  const count = (key) => {
    const tally = {};
    for (const finding of findings) tally[finding[key]] = (tally[finding[key]] || 0) + 1;
    return Object.entries(tally).map(([name, total]) => name + " " + total);
  };
  const files = count("file");
  return (
    "Work left: " +
    plural(findings.length, "thing") +
    " to change in " +
    plural(files.length, "file") +
    " (" +
    files.join(", ") +
    "); by axis: " +
    count("axis").join(", ")
  );
}

const indent = (text, spaces) =>
  text
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");

/** One finding for the build to print: its line, what to change, its link, its code and its test when it has one. */
export function renderFinding(finding, tag) {
  const lines = [
    tag + " " + finding.axis + " " + finding.file + ":" + finding.line + ": " + firstSentence(finding.claim),
  ];
  if (finding.change) lines.push("  Change: " + finding.change);
  if (finding.link) lines.push("  Open: " + finding.link);
  if (finding.snippet) lines.push(indent(finding.snippet, 4));
  if (finding.testLink) lines.push("  Test: " + finding.test.file + ":" + finding.test.from + "  " + finding.testLink);
  if (finding.testSource) lines.push(indent(finding.testSource, 4));
  return lines.join("\n");
}
