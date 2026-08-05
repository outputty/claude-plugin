// self-check for tasks.js.  Run: node skills/outputty/tasks.test.js
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

// Tasks sharing a folder belong in ONE layer — a layer is built by one agent, in sequence, so a shared
// scope is the normal case, not a missing dep. (The old same-layer clash check forced them apart.)
assert.deepStrictEqual(
  schedule([
    { id: "a", status: "open", deps: [], scope: ["src/core"] },
    { id: "b", status: "open", deps: [], scope: ["src/core"] },
  ]).map((layer) => layer.map((t) => t.id)),
  [["a", "b"]],
  "tasks sharing a folder share a layer",
);
assert.deepStrictEqual(
  ready([
    { id: "a", status: "open", deps: [], scope: ["src/core"] },
    { id: "b", status: "open", deps: [], scope: ["src/core"] },
  ]).map((t) => t.id),
  ["a", "b"],
  "ready returns both tasks in a shared folder",
);

console.log("tasks.js: all checks passed");
