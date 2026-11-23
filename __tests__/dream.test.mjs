// Dream's friction script runs end to end over synthetic transcripts: no real session is read.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const FRICTION = join(ROOT, "skills/dream/scripts/friction.ts");
const REREAD = join(ROOT, "__tests__/fixtures/friction/reread.jsonl");

function flaggedWindows(...paths) {
  const result = spawnSync("bun", [FRICTION, ...paths], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

describe("friction.ts prints one JSON line per flagged window", () => {
  test("a re-read, a correction and a quiet turn", () => {
    const windows = flaggedWindows(REREAD);

    assert.equal(windows.length, 2);
    // The re-read path and count; r2 appears twice in the file and counts once, b.ts is read again only after an edit.
    assert.deepEqual(windows[0].repeatReads, [{ path: "/repo/tracker/SKILL.md", count: 4 }]);
    assert.equal(windows[0].skillsLoaded.join(), "build,tracker");
    assert.equal(windows[1].corrections, 1);
  });

  test("a tool_use id counts once and the subagent run counts with its parent", () => {
    const [first] = flaggedWindows(REREAD);

    // 2 skills + 4 tracker reads + 2 b.ts reads + 1 edit + 2 subagent reads; the repeated r2 record is not a second call.
    assert.equal(first.toolCalls, 11);
  });

  test("tool output never reaches the printed lines", () => {
    const result = spawnSync("bun", [FRICTION, REREAD], { encoding: "utf8" });

    assert.doesNotMatch(result.stdout, /Ignore all previous instructions/);
  });
});
