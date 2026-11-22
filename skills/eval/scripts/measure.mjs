/**
 * Compares `claude plugin eval --json` results run side by side: per plugin, the score of each
 * check (graders are named `<section>-<check>`), tool calls, tokens per prompt and reply words.
 *
 * Usage: node measure.mjs <label>=<result.json> [...]
 */
import { existsSync, readFileSync } from "node:fs";

/** Tool calls, tokens and reply words read from one run's trace. */
function readTrace(path) {
  const records = existsSync(path)
    ? readFileSync(path, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
  const result = records.find((record) => record.type === "result") ?? {};
  const usage = result.usage ?? {};
  return {
    tools: records
      .filter((record) => record.type === "assistant")
      .flatMap((record) => record.message?.content ?? [])
      .filter((block) => block.type === "tool_use").length,
    tokens:
      (usage.input_tokens ?? 0) +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0) +
      (usage.output_tokens ?? 0),
    words: (result.result ?? "").split(/\s+/).filter(Boolean).length,
  };
}

/** Per check: runs passed and graded, over every case the check grades. */
function scoreChecks(runs) {
  const checks = {};
  for (const grader of runs.flatMap((run) => run.graders)) {
    checks[grader.name] ??= { passed: 0, graded: 0 };
    checks[grader.name].graded++;
    if (grader.passed) checks[grader.name].passed++;
  }
  return checks;
}

for (const argument of process.argv.slice(2)) {
  const [label, file] = argument.split("=");
  const runs = JSON.parse(readFileSync(file, "utf8")).cases.flatMap((testCase) => testCase.arms.with ?? []);
  const traces = runs.map((run) => readTrace(run.tracePath));
  const sum = (key) => traces.reduce((total, trace) => total + trace[key], 0);
  // A section total hides a check that dropped to zero behind one that rose, so every check prints alone.
  const checks = Object.entries(scoreChecks(runs))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([check, { passed, graded }]) => `${check} ${passed}/${graded}`);
  console.log(
    `${label.padEnd(14)} runs ${runs.length}  tools ${sum("tools")}  tokens ${Math.round(sum("tokens") / 1000)}k  words ${sum("words")}\n  ${checks.join("\n  ")}`,
  );
}
