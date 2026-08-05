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

// amend widens an OPEN task's scope. QA can find that a done-condition genuinely needs an edit outside
// its folder; before this existed the only route was hand-editing the JSONL, which require-grill.js
// denies in a resumed BUILD session — so the documented fix had no mechanism behind it.
{
  const { commands } = require("./tasks.js");
  const file = require("path").join(require("os").tmpdir(), `amend-probe-${process.pid}.jsonl`);
  const call = (tasks, args) => commands.amend(tasks, { args, file });

  const open = [{ id: "t-1", status: "open", deps: [], scope: ["src/a"], brief: "b" }];
  call(open, { positional: ["t-1"], scope: "src/b" });
  assert.deepStrictEqual(open[0].scope, ["src/a", "src/b"], "amend widens scope, keeping what was there");

  call(open, { positional: ["t-1"], brief: "sharper" });
  assert.equal(open[0].brief, "sharper", "amend replaces the brief");

  assert.throws(
    () => call(open, { positional: ["t-1"], scope: "src/a" }),
    /already covers/,
    "a scope the task already has is refused rather than duplicated",
  );
  assert.throws(
    () => call(open, { positional: ["t-1"] }),
    /needs --scope or --brief/,
    "amend with no flags is refused",
  );
  assert.throws(
    () => call(open, { positional: ["nope"], scope: "src/c" }),
    /no task nope/,
    "amending a task that does not exist is refused",
  );
  assert.throws(
    () =>
      call([{ id: "t-9", status: "done", deps: [], scope: ["src/a"], brief: "" }], {
        positional: ["t-9"],
        scope: "src/b",
      }),
    /orphans committed work/,
    "a done task is refused — its scope already decided what got committed",
  );
}

console.log("tasks.js: all checks passed");
