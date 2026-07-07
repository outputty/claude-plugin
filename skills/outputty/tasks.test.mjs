// ponytail self-check for tasks.mjs. Run: node skills/outputty/tasks.test.mjs
import assert from "node:assert/strict";
import { schedule, ready } from "./tasks.mjs";

const g = [
  { id: "api", status: "open", deps: [], scope: ["a.ts"] },
  { id: "schema", status: "open", deps: [], scope: ["b.sql"] },
  { id: "ui", status: "open", deps: ["api"], scope: ["c.tsx"] },
  { id: "docs", status: "open", deps: ["api", "ui"], scope: ["README.md"] },
];
assert.deepEqual(
  schedule(g).map((l) => l.map((t) => t.id)),
  [["api", "schema"], ["ui"], ["docs"]],
  "layers derived from deps"
);
assert.deepEqual(ready(g).map((t) => t.id), ["api", "schema"], "ready = first layer");

// a done dependency unblocks its dependent (resumable across runs)
assert.deepEqual(
  ready([
    { id: "ui", status: "open", deps: ["api"], scope: [] },
    { id: "api", status: "done", deps: [], scope: [] },
  ]).map((t) => t.id),
  ["ui"],
  "done dep unblocks dependent"
);

// cycles fail loud
assert.throws(
  () =>
    schedule([
      { id: "x", status: "open", deps: ["y"], scope: [] },
      { id: "y", status: "open", deps: ["x"], scope: [] },
    ]),
  /cycle|unmet/,
  "cycle detected"
);

// two ready tasks touching one file = a missing dep
assert.throws(
  () =>
    schedule([
      { id: "a", status: "open", deps: [], scope: ["f.ts"] },
      { id: "b", status: "open", deps: [], scope: ["f.ts"] },
    ]),
  /scope clash/,
  "scope clash detected"
);

console.log("tasks.mjs: all checks passed");
