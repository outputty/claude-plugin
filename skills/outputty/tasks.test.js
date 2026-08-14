// self-check for tasks.js. Runs on bun for Bun.YAML.  Run: bun skills/outputty/tasks.test.js
const assert = require("assert").strict;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const {
  schedule,
  ready,
  planning,
  specSettled,
  dispatchFlags,
  TIERS,
  SPEC_STATES,
  commands,
  trailFile,
  trailTasks,
  loadTasks,
  loadState,
  saveState,
  buildIndex,
} = require("./tasks.js");

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
// scope is the normal case, not a missing dep.
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

// ---------------------------------------------------------------------------
// Storage: the trail holds the structure, one file per task holds the state.
// ---------------------------------------------------------------------------

/**
 * A repo-shaped fixture: a hand-authored trail with a `tasks:` section, and an empty state directory.
 * @param {string} [tasksBlock] - the YAML for the trail's `tasks:` section.
 * @returns {{home: string, trail: string, state: string, index: string}} the paths under test.
 */
function fixture(tasksBlock) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "outputty-home-"));
  fs.mkdirSync(path.join(home, "trails"), { recursive: true });
  const trail = path.join(home, "trails", "feature-x.trail.yaml");
  fs.writeFileSync(trail, TRAIL(tasksBlock));
  return { home, trail, state: path.join(home, "tasks"), index: path.join(home, "tasks.yaml") };
}

// The hand-authored shape this whole split exists to protect: `|` block scalars in `core_objective` and
// in every `decisions` answer. `Bun.YAML.stringify` flattens a block scalar into an escaped one-liner,
// so any tool that rewrote this file would destroy the prose.
const TRAIL = (
  tasksBlock = `
  - id: t1
    title: base
    deps: []
    scope: ["src/core"]
    brief: |
      Two lines of hand-authored prose,
      with a blank line and a "quote" in it.
  - id: t2
    title: on t1
    deps: [t1]
    scope: ["src/api"]
`,
) => `core_objective: |
  The destination, written by hand.
  It spans two lines on purpose.

decisions:
  - question: The storage split
    answer: |
      The trail is read-only to tooling.
      State goes to one file per task.
    link: ""

not_yet_specified: []

out_of_scope: []

tasks:${tasksBlock}`;

// The trail's `tasks:` section IS the graph structure.
{
  const { trail, state } = fixture();
  assert.deepStrictEqual(
    trailTasks(trail).map((t) => t.id),
    ["t1", "t2"],
    "the graph is read from the trail's tasks: section",
  );
  assert.deepStrictEqual(
    loadTasks(trail, false, state).map((t) => ({ id: t.id, status: t.status, deps: t.deps })),
    [
      { id: "t1", status: "open", deps: [] },
      { id: "t2", status: "open", deps: ["t1"] },
    ],
    "a task with no state file defaults to open",
  );

  // A bare YAML list is the pre-merge `<branch>.tasks.yaml` shape. It fails loud rather than being read
  // as a trail with no graph, which would silently schedule nothing.
  const bare = path.join(path.dirname(trail), "feature-bare.trail.yaml");
  fs.writeFileSync(bare, "- id: t1\n  title: base\n");
  assert.throws(() => trailTasks(bare), /bare list/, "a bare list is refused, not silently empty");

  // An explicitly-named trail that is missing fails loud; a derived one returns [].
  assert.throws(() => trailTasks(path.join(path.dirname(trail), "nope.trail.yaml"), true), /trail not found/);
  assert.deepStrictEqual(trailTasks(path.join(path.dirname(trail), "nope.trail.yaml"), false), []);
}

// ⚠ THE ASSERTION THIS SPLIT EXISTS FOR: `close` must not touch the trail, byte for byte.
{
  const { trail, state } = fixture();
  const before = fs.readFileSync(trail);
  commands.close(loadTasks(trail, false, state), { args: { positional: ["t1"] }, state });
  const after = fs.readFileSync(trail);
  assert.ok(before.equals(after), "close rewrote the trail — hand-authored block scalars would be lost");
  assert.equal(
    fs.readFileSync(trail, "utf8").includes("core_objective: |"),
    true,
    "the trail's block scalars survive a close",
  );
  assert.equal(
    loadTasks(trail, false, state).find((t) => t.id === "t1").status,
    "done",
    "the state file is what makes the task done",
  );
}

// A write touches exactly ONE file, so two sessions never write the same file and merges never conflict.
{
  const { trail, state } = fixture();
  commands.close(loadTasks(trail, false, state), { args: { positional: ["t1"] }, state });
  assert.deepStrictEqual(fs.readdirSync(state), ["t1.yaml"], "close writes one state file and nothing else");
  assert.deepStrictEqual(loadState(state), [{ id: "t1", status: "done" }], "the state file holds only state");

  commands.close(loadTasks(trail, false, state), { args: { positional: ["t2"] }, state });
  assert.deepStrictEqual(fs.readdirSync(state).sort(), ["t1.yaml", "t2.yaml"], "each task owns its own file");
}

// `amend` widens an OPEN task's scope. The widened scope lands in the state file; the trail keeps the
// scope PLAN authored.
{
  const { trail, state } = fixture();
  const call = (args) => commands.amend(loadTasks(trail, false, state), { args, state });

  call({ positional: ["t1"], scope: "src/b" });
  const amended = loadTasks(trail, false, state).find((t) => t.id === "t1");
  assert.deepStrictEqual(amended.scope, ["src/core", "src/b"], "amend widens scope, keeping what was there");
  assert.ok(fs.readFileSync(trail, "utf8").includes('scope: ["src/core"]'), "the trail still holds PLAN's scope");

  call({ positional: ["t1"], brief: "sharper" });
  assert.equal(loadTasks(trail, false, state).find((t) => t.id === "t1").brief, "sharper", "amend replaces brief");

  assert.throws(
    () => call({ positional: ["t1"], scope: "src/b" }),
    /already covers/,
    "a scope the task already has is refused rather than duplicated",
  );
  assert.throws(() => call({ positional: ["t1"] }), /needs --scope or --brief/, "amend with no flags is refused");
  assert.throws(() => call({ positional: ["nope"], scope: "src/c" }), /no task nope/, "amending a ghost is refused");

  commands.close(loadTasks(trail, false, state), { args: { positional: ["t2"] }, state });
  assert.throws(
    () => call({ positional: ["t2"], scope: "src/c" }),
    /orphans committed work/,
    "a done task is refused — its scope already decided what got committed",
  );
}

// Discovered work has no trail entry, so its whole record lives in its own state file and still joins
// the graph.
{
  const { trail, state } = fixture();
  commands.add(loadTasks(trail, false, state), {
    args: { positional: ["t9", "discovered"], deps: "t1", scope: "src/z", from: "t1" },
    state,
  });
  const joined = loadTasks(trail, false, state);
  const discovered = joined.find((t) => t.id === "t9");
  assert.deepStrictEqual(
    { title: discovered.title, deps: discovered.deps, from: discovered.discovered_from },
    { title: "discovered", deps: ["t1"], from: "t1" },
    "a discovered task joins the graph from its state file alone",
  );
  assert.ok(fs.readFileSync(trail, "utf8").indexOf("t9") === -1, "add never writes the trail");
  assert.deepStrictEqual(
    ready(joined).map((t) => t.id),
    ["t1"],
    "the discovered task waits on its dep like any other",
  );
  assert.throws(
    () => commands.add(loadTasks(trail, false, state), { args: { positional: ["t1", "dup"] }, state }),
    /already exists/,
    "an id already in the trail cannot be re-added",
  );
}

// `index` regenerates `.claude/tasks.yaml` from every trail plus every state file. It is derived: a hand
// edit is overwritten, and the record shape is the one `docs.js tasks` filters on.
{
  const { home, trail, state, index } = fixture();
  commands.close(loadTasks(trail, false, state), { args: { positional: ["t1"] }, state });
  commands.add(loadTasks(trail, false, state), {
    args: { positional: ["t9", "discovered"], deps: "t1", from: "t1" },
    state,
  });

  fs.writeFileSync(index, "- id: hand-edited\n");
  const records = buildIndex({ trails: path.join(home, "trails"), state, out: index });
  assert.deepStrictEqual(
    records,
    [
      { id: "t1", kind: "task", status: "done", deps: [], summary: "base", link: ".claude/tasks/t1.yaml" },
      { id: "t2", kind: "task", status: "open", deps: ["t1"], summary: "on t1", link: ".claude/tasks/t2.yaml" },
      { id: "t9", kind: "task", status: "open", deps: ["t1"], summary: "discovered", link: ".claude/tasks/t9.yaml" },
    ],
    "the index joins trail structure with task state, sorted by id",
  );
  const written = fs.readFileSync(index, "utf8");
  assert.ok(written.startsWith("# DERIVED"), "the index says it is derived");
  assert.ok(!written.includes("hand-edited"), "a hand edit is overwritten by the next index run");
  assert.deepStrictEqual(Bun.YAML.parse(written), records, "the index file parses back to the records");
}

// A state file whose name and `id` disagree is a corruption, not a rename — it fails loud.
{
  const { state } = fixture();
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(path.join(state, "t1.yaml"), "id: something-else\nstatus: done\n");
  assert.throws(() => loadState(state), /the file name is the id/, "a mismatched state file fails loud");
}

// saveState merges rather than replacing, so closing a task keeps the tier a dispatch already recorded.
{
  const { state } = fixture();
  saveState(state, "t1", { tier: 1 });
  saveState(state, "t1", { status: "done" });
  assert.deepStrictEqual(loadState(state), [{ id: "t1", tier: 1, status: "done" }], "state writes merge");
}

// A branch name with "/" must not derive a nested path — `.claude/trails/feature/x.trail.yaml` is never
// created. Use a real checked-out repo so this exercises trailFile()'s actual `git rev-parse` call.
{
  const origTasks = process.env.OUTPUTTY_TASKS;
  const origHome = process.env.OUTPUTTY_HOME;
  delete process.env.OUTPUTTY_TASKS;
  delete process.env.OUTPUTTY_HOME;
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "tasks-branch-"));
  execSync("git init -q -b feature/x", { cwd: repo });
  execSync("git -c user.email=t@t -c user.name=t commit -q --allow-empty -m x", { cwd: repo });
  const origCwd = process.cwd();
  process.chdir(repo);
  try {
    const { path: resolved, explicit } = trailFile();
    assert.equal(resolved, ".claude/trails/feature-x.trail.yaml", "a slashed branch name is slugified flat");
    assert.equal(explicit, false, "a derived path is not explicit");
  } finally {
    process.chdir(origCwd);
    if (origTasks !== undefined) process.env.OUTPUTTY_TASKS = origTasks;
    if (origHome !== undefined) process.env.OUTPUTTY_HOME = origHome;
  }
}

// `spec: replan` holds a task out of `ready` however clear its deps are. This is the grilling kickback:
// a session that cannot proceed without a ruling flips its own task rather than guessing. Absent means
// settled, so every graph written before the field keeps scheduling exactly as it did.
{
  const tasks = [
    { id: "settled", status: "open", deps: [], spec: "settled" },
    { id: "kicked-back", status: "open", deps: [], spec: "replan" },
    { id: "unlabelled", status: "open", deps: [] },
  ];
  assert.deepStrictEqual(
    ready(tasks).map((t) => t.id),
    ["settled", "unlabelled"],
    "a task sent back for replanning is not ready, and an unlabelled task still is",
  );
  // The two queues are disjoint by construction: nothing is claimable by both stages at once.
  const readyIds = ready(tasks).map((t) => t.id);
  const planningIds = planning(tasks).map((t) => t.id);
  assert.deepStrictEqual(planningIds, ["kicked-back"], "planning owns exactly what build cannot take");
  assert.deepStrictEqual(
    readyIds.filter((id) => planningIds.includes(id)),
    [],
    "ready and planning never overlap",
  );
  assert.equal(specSettled({}), true, "absent spec means settled");
  assert.equal(specSettled({ spec: "replan" }), false, "a replan is planning's, not build's");
  assert.equal(specSettled({ spec: "drafting" }), false, "drafting is planning's");
  assert.throws(
    () => specSettled({ id: "x", spec: "nonsense" }),
    /unknown spec state 'nonsense'.*drafting, settled, replan/,
    "an unknown spec state fails loud rather than silently skipping the task",
  );
  assert.deepStrictEqual(SPEC_STATES, ["drafting", "settled", "replan"], "the lifecycle is exactly three states");
}

// `spec` is state, so it rides in the task's own file and holds the task out of `ready` from there.
{
  const { trail, state } = fixture();
  saveState(state, "t1", { spec: "replan" });
  const joined = loadTasks(trail, false, state);
  assert.deepStrictEqual(
    ready(joined).map((t) => t.id),
    [],
    "a replan written to the state file holds the task out of ready",
  );
  assert.deepStrictEqual(
    planning(joined).map((t) => t.id),
    ["t1"],
    "and hands it to the planning stage",
  );
}

// `tier` selects the MODEL. Full ids only: the `opus` alias resolves to the latest of that family, so
// it would silently select Opus 5 where tier 3 means Opus 4.8.
{
  assert.deepStrictEqual(
    dispatchFlags({ id: "t", tier: 1 }),
    { model: "claude-haiku-4-5-20251001", effort: "medium" },
    "tier 1 dispatches haiku",
  );
  assert.equal(dispatchFlags({ id: "t", tier: 4 }).model, "claude-fable-5", "tier 4 dispatches fable 5");
  assert.equal(dispatchFlags({ id: "t" }).model, "claude-opus-4-8", "an unlabelled task defaults to tier 3");
  for (const flags of Object.values(TIERS)) {
    assert(!/^(opus|sonnet|haiku|fable)$/.test(flags.model), `${flags.model} must be a full id, never an alias`);
  }
  assert.throws(() => dispatchFlags({ id: "t", tier: 9 }), /unknown tier 9/, "an unknown tier fails loud");
}

console.log("tasks.js: all checks passed");
