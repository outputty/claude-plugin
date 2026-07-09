// ponytail self-check for tasks.js.  Run: node skills/outputty/tasks.test.js
const assert = require("assert").strict;
const { schedule, ready } = require("./tasks.js");

const graph = [
  { id: "api", status: "open", deps: [], scope: ["a.ts"] },
  { id: "schema", status: "open", deps: [], scope: ["b.sql"] },
  { id: "ui", status: "open", deps: ["api"], scope: ["c.tsx"] },
  { id: "docs", status: "open", deps: ["api", "ui"], scope: ["README.md"] },
];

assert.deepEqual(
  schedule(graph).map((layer) => layer.map((t) => t.id)),
  [["api", "schema"], ["ui"], ["docs"]],
  "layers derived from deps",
);
assert.deepEqual(
  ready(graph).map((t) => t.id),
  ["api", "schema"],
  "ready = first layer",
);

// a done dependency unblocks its dependent (resumable across runs)
assert.deepEqual(
  ready([
    { id: "ui", status: "open", deps: ["api"], scope: [] },
    { id: "api", status: "done", deps: [], scope: [] },
  ]).map((t) => t.id),
  ["ui"],
  "done dep unblocks dependent",
);

// cycles fail loud
assert.throws(
  () =>
    schedule([
      { id: "x", status: "open", deps: ["y"], scope: [] },
      { id: "y", status: "open", deps: ["x"], scope: [] },
    ]),
  /cycle|unmet/,
  "cycle detected",
);

// two ready tasks touching one file = a missing dep — schedule AND ready both fail loud
assert.throws(
  () =>
    schedule([
      { id: "a", status: "open", deps: [], scope: ["f.ts"] },
      { id: "b", status: "open", deps: [], scope: ["f.ts"] },
    ]),
  /scope clash/,
  "scope clash detected by schedule",
);
assert.throws(
  () =>
    ready([
      { id: "a", status: "open", deps: [], scope: ["f.ts"] },
      { id: "b", status: "open", deps: [], scope: ["f.ts"] },
    ]),
  /scope clash/,
  "scope clash detected by ready (drain-loop safety)",
);

console.log("tasks.js: all checks passed");
