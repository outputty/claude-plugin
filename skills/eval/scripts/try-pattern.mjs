/**
 * Tries draft patterns on one case's saved runs, per version, before they become graders: against the reply
 * text, or with --bash against every Bash command a run made.
 *
 * Usage: node try-pattern.mjs [--bash] <case-dir regex> <round.json>... -- <name>::<yes|not>::<regex>...
 * Example: node try-pattern.mjs hook/fix tmp/r/base.json tmp/r/cand.json -- 'log-file::yes::>\s*\S+\s+2>&1'
 */
import { existsSync, readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const onBash = argv[0] === "--bash";
const [caseFilter, ...rest] = onBash ? argv.slice(1) : argv;
const separator = rest.indexOf("--");
const files = rest.slice(0, separator);
const patterns = rest.slice(separator + 1).map((spec) => {
  const [name, sense, source] = spec.split("::");
  return { name, negate: sense === "not", pattern: new RegExp(source) };
});

/** What one run is matched against: its reply, or its Bash commands joined. */
function readTarget(tracePath) {
  if (!existsSync(tracePath)) return "";
  const records = readFileSync(tracePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  if (!onBash) return records.find((record) => record.type === "result")?.result ?? "";
  return records
    .filter((record) => record.type === "assistant")
    .flatMap((record) => record.message?.content ?? [])
    .filter((block) => block.type === "tool_use" && block.name === "Bash")
    .map((block) => block.input.command)
    .join("\n;;\n");
}

for (const file of files) {
  const result = JSON.parse(readFileSync(file, "utf8"));
  const targets = result.cases
    .filter((testCase) => new RegExp(caseFilter).test(testCase.dir))
    .flatMap((testCase) => testCase.arms.with ?? [])
    .map((run) => readTarget(run.tracePath));
  const label = file.split("/").pop().replace(".json", "");
  const scores = patterns.map(
    ({ name, negate, pattern }) =>
      `${name} ${targets.filter((target) => pattern.test(target) !== negate).length}/${targets.length}`,
  );
  console.log(`${label.padEnd(14)}${scores.join("  ")}`);
}
