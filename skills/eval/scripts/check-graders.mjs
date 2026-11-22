/**
 * Runs every regex grader of the suite over the replies saved by earlier rounds, offline, so a check that
 * passes a reply missing its form, or fails one that has it, shows before it judges a candidate.
 *
 * Usage: node check-graders.mjs <evals-dir> <rounds-dir> [grader,...]
 * Prints, per case and grader, how many saved replies pass, with one passing and one failing excerpt.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const [evalsRoot, roundsRoot, only] = process.argv.slice(2);

/** The final reply text of one run's trace. */
function readReply(tracePath) {
  if (!tracePath || !existsSync(tracePath)) return null;
  const records = readFileSync(tracePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return records.find((record) => record.type === "result")?.result ?? null;
}

/** Every saved reply, keyed by its case folder under evals/. */
function readSavedReplies() {
  const replies = {};
  for (const round of readdirSync(roundsRoot).filter((name) => statSync(join(roundsRoot, name)).isDirectory())) {
    for (const file of readdirSync(join(roundsRoot, round)).filter((name) => name.endsWith(".json"))) {
      const result = JSON.parse(readFileSync(join(roundsRoot, round, file), "utf8"));
      for (const testCase of result.cases ?? []) {
        const key = testCase.dir.replace(/^evals\//, "");
        for (const run of testCase.arms?.with ?? []) {
          const text = readReply(run.tracePath);
          if (text) (replies[key] ??= []).push(text);
        }
      }
    }
  }
  return replies;
}

/** Every grader file under the suite. */
function listGraders(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listGraders(path);
    return path.includes("/graders/") ? [path] : [];
  });
}

const replies = readSavedReplies();
for (const path of listGraders(evalsRoot).sort()) {
  const body = readFileSync(path, "utf8");
  // Only a regex grader on the reply can be replayed offline; tool and judge graders need the run itself.
  if (!/type: regex/.test(body)) continue;
  if (/source: file|target: trace/.test(body)) continue;
  const name = path.split("/").pop().replace(".md", "");
  if (only && !only.split(",").includes(name)) continue;
  const pattern = new RegExp(JSON.parse(body.match(/pattern: (".*")/)[1]));
  const negate = /match: not_contains/.test(body);
  const caseDir = path.slice(evalsRoot.length + 1).split("/graders/")[0];
  const saved = replies[caseDir] ?? [];
  const passing = saved.filter((text) => pattern.test(text) !== negate);
  const failing = saved.filter((text) => pattern.test(text) === negate);
  const excerpt = (text) => {
    const match = text.match(pattern);
    return JSON.stringify(match ? text.slice(Math.max(0, match.index - 40), match.index + 60) : text.slice(0, 100));
  };
  console.log(`${caseDir} ${name}: pass ${passing.length}/${saved.length}`);
  if (passing[0]) console.log(`   pass e.g. ${excerpt(passing[0])}`);
  if (failing[0]) console.log(`   fail e.g. ${excerpt(failing[0])}`);
}
