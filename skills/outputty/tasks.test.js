// self-check for tasks.js. Runs on bun for Bun.YAML.  Run: bun skills/outputty/tasks.test.js
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
// its folder; before this existed the only route was hand-editing the JSONL, off-protocol and
// unvalidated — so the documented fix had no mechanism behind it.
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

// YAML storage: loadTasks/saveTasks round-trip through the block-style YAML this file writes — one
// field per line, readable and hand-editable, unlike JSONL.
{
  const { loadTasks, saveTasks, taskFile } = require("./tasks.js");
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tasks-yaml-"));

  const yamlFile = path.join(dir, "g.tasks.yaml");
  const written = [{ id: "t-1", title: "a", status: "open", deps: [], scope: ["src"], brief: "b" }];
  saveTasks(yamlFile, written);
  const raw = fs.readFileSync(yamlFile, "utf8");
  assert.ok(raw.startsWith("- id: t-1"), "YAML graph is written block-style, one field per line");
  assert.ok(!raw.includes("{"), "block style has no flow-style braces");
  assert.deepStrictEqual(loadTasks(yamlFile), written, "YAML graph round-trips through save/load");

  // A branch name with "/" must not derive a nested path — `.claude/trails/feature/x.tasks.yaml` is
  // never created, and the old code silently read that as "no tasks yet" instead of a bug. Use a real
  // checked-out repo so this exercises taskFile()'s actual `git rev-parse` call, not a mock of it.
  const origEnv = process.env.OUTPUTTY_TASKS;
  delete process.env.OUTPUTTY_TASKS;
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "tasks-branch-"));
  const { execSync } = require("child_process");
  execSync("git init -q -b feature/x", { cwd: repo });
  execSync("git -c user.email=t@t -c user.name=t commit -q --allow-empty -m x", { cwd: repo });
  const origCwd = process.cwd();
  process.chdir(repo);
  try {
    const { path: resolved, explicit } = taskFile();
    assert.equal(resolved, ".claude/trails/feature-x.tasks.yaml", "a slashed branch name is slugified flat");
    assert.equal(explicit, false, "a derived path is not explicit");
  } finally {
    process.chdir(origCwd);
    if (origEnv !== undefined) process.env.OUTPUTTY_TASKS = origEnv;
  }

  // An explicitly-named graph (OUTPUTTY_TASKS) that is missing fails loud instead of returning [] —
  // a typo in an explicit path is a mistake, not a fresh branch with no tasks yet.
  assert.throws(
    () => loadTasks(path.join(dir, "does-not-exist.tasks.yaml"), true),
    /task graph not found/,
    "a missing EXPLICIT graph raises instead of silently returning []",
  );
  assert.deepStrictEqual(
    loadTasks(path.join(dir, "does-not-exist.tasks.yaml"), false),
    [],
    "a missing DERIVED graph still returns [] — a brand-new branch legitimately has no tasks yet",
  );
}

console.log("tasks.js: all checks passed");
