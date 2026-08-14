// self-check for docs.js. Runs on bun for Bun.YAML.parse. Run: bun skills/outputty/docs.test.js
const assert = require("assert").strict;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { query, matches, SETS } = require("./docs.js");

// The canonical worked example — `.claude/examples.yaml` "A product-doc query".
const LESSONS_YAML = `
- {"version": "0.46.0", "title": "One response shape", "files": ["hooks/protocol.md"]}
- {"version": "0.44.1", "title": "The grill gate was never invoked", "files": ["hooks/hooks.json"]}
`;

const fixture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "docs-test-")), "lessons.yaml");
fs.writeFileSync(fixture, LESSONS_YAML);

// `matches` — containment for array fields, equality for scalars.
assert.equal(matches({ files: ["a.md", "b.md"] }, { files: "a.md" }), true, "array field matches by containment");
assert.equal(matches({ files: ["a.md"] }, { files: "b.md" }), false, "array field misses an absent value");
assert.equal(matches({ status: "open" }, { status: "open" }), true, "scalar field matches by equality");

// `query` against a real parsed fixture — the worked example, run in-process.
process.env.OUTPUTTY_DOCS = fixture;
assert.deepStrictEqual(
  query("lessons", { files: "hooks/protocol.md" }),
  [{ version: "0.46.0", title: "One response shape", files: ["hooks/protocol.md"] }],
  "query returns only the record whose files contain the path",
);
delete process.env.OUTPUTTY_DOCS;

// The CLI end to end, via bun — same fixture, `--json` mode.
const out = execFileSync(
  "bun",
  [path.join(__dirname, "docs.js"), "lessons", "--files", "hooks/protocol.md", "--json"],
  {
    encoding: "utf8",
    env: { ...process.env, OUTPUTTY_DOCS: fixture },
  },
);
assert.deepStrictEqual(
  JSON.parse(out),
  [{ version: "0.46.0", title: "One response shape", files: ["hooks/protocol.md"] }],
  "CLI --json matches the worked example",
);

// The non-JSON CLI mode prints one line per record.
const outPlain = execFileSync("bun", [path.join(__dirname, "docs.js"), "lessons", "--files", "hooks/protocol.md"], {
  encoding: "utf8",
  env: { ...process.env, OUTPUTTY_DOCS: fixture },
});
assert.equal(outPlain.trim().split("\n").length, 1, "plain mode prints one line per matching record");

// An unknown set fails loud rather than returning an empty result.
assert.throws(
  () => {
    delete process.env.OUTPUTTY_DOCS;
    query("nonsense", {});
  },
  /unknown record set/,
  "an unknown set is refused, not silently empty",
);

// The `tasks` set — the DERIVED task index (`.claude/tasks.yaml`), list-shaped: one record per tracked
// unit, `deps` matching by containment like every array field. `tasks.js index` regenerates it from
// every trail's `tasks:` section joined with `.claude/tasks/<id>.yaml`, so the shape asserted here is
// exactly what `indexRecord` emits: id, kind, status, deps, summary, link.
const TASKS_YAML = `
# DERIVED — regenerate with \`tasks.js index\`. Never hand-edit this file.
- {"id": "a2-connection-leak", "kind": "bug", "status": "open", "deps": [], "summary": "engine session not disposed on a failed attach", "link": ".claude/tasks/a2-connection-leak.yaml"}
- {"id": "docs-sweep", "kind": "task", "status": "done", "deps": ["a2-connection-leak"], "summary": "bring the docs in line", "link": ".claude/tasks/docs-sweep.yaml"}
`;
const tasksFixture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "docs-test-")), "tasks.yaml");
fs.writeFileSync(tasksFixture, TASKS_YAML);
process.env.OUTPUTTY_DOCS = tasksFixture;
assert.deepStrictEqual(
  query("tasks", { status: "open" }, { fields: ["id", "kind", "summary"] }),
  [{ id: "a2-connection-leak", kind: "bug", summary: "engine session not disposed on a failed attach" }],
  "the tasks index answers --status open with projected fields",
);
assert.equal(query("tasks", { deps: "a2-connection-leak" }).length, 1, "a task's deps match by containment");
delete process.env.OUTPUTTY_DOCS;
assert.equal(SETS.tasks.path, ".claude/tasks.yaml", "tasks is the repo-level index, not a per-branch graph");

// The index is derived output, so the record shape `docs.js tasks` filters on must be exactly what
// `tasks.js index` writes. A field added on one side and not the other is a silently empty query.
{
  const { indexRecord } = require("./tasks.js");
  assert.deepStrictEqual(
    Object.keys(indexRecord({ id: "t-1", title: "base", status: "done", deps: ["t-0"] })),
    ["id", "kind", "status", "deps", "summary", "link", "tier"],
    "the index record shape is the one the tasks set is queried by",
  );
}

// A MAPPING set (product/architecture's shape: prose sections + record sections) — the fixture from the
// task brief.
const PRODUCT_YAML = `
north_star: |
  A single spec-driven Claude Code plugin applied to every project.
language:
  - term: Layer
    definition: the set of tasks whose deps are all done
    replaces: [wave]
`;
const productFixture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "docs-test-")), "product.yaml");
fs.writeFileSync(productFixture, PRODUCT_YAML);
process.env.OUTPUTTY_DOCS = productFixture;

// A record section, queried and filtered like a flat list.
assert.deepStrictEqual(
  query("product", { term: "Layer" }, { section: "language" }),
  [{ term: "Layer", definition: "the set of tasks whose deps are all done", replaces: ["wave"] }],
  "a record section is queried and filtered like a flat list",
);

// A prose section returns its text, filters ignored (there are no fields to filter).
assert.equal(
  query("product", {}, { section: "north_star" }).trim(),
  "A single spec-driven Claude Code plugin applied to every project.",
  "a prose section returns its text",
);

// A mapping set queried with no --section fails loud and names the sections that do exist.
assert.throws(
  () => query("product", {}, {}),
  /sectioned set.*sections: north_star, language/,
  "a mapping set with no --section fails loud, naming its sections",
);

// A missing section on a mapping set fails loud the same way.
assert.throws(
  () => query("product", {}, { section: "nonsense" }),
  /no section 'nonsense'.*sections: north_star, language/,
  "an unknown section fails loud, naming the sections that do exist",
);

// The CLI end to end, `--section` — the worked example from the task brief.
const outSection = execFileSync(
  "bun",
  [path.join(__dirname, "docs.js"), "product", "--section", "language", "--term", "Layer", "--json"],
  { encoding: "utf8", env: { ...process.env, OUTPUTTY_DOCS: productFixture } },
);
assert.deepStrictEqual(
  JSON.parse(outSection),
  [{ term: "Layer", definition: "the set of tasks whose deps are all done", replaces: ["wave"] }],
  "CLI --section matches the worked example",
);
delete process.env.OUTPUTTY_DOCS;

// A list-shaped set keeps working unchanged with no --section — the plain `lessons` query above already
// proves this; here it's proven explicitly that passing no section is not an error for a list.
process.env.OUTPUTTY_DOCS = fixture;
assert.deepStrictEqual(
  query("lessons", { files: "hooks/protocol.md" }, {}),
  [{ version: "0.46.0", title: "One response shape", files: ["hooks/protocol.md"] }],
  "a list-shaped set is unaffected by the (absent) --section",
);
delete process.env.OUTPUTTY_DOCS;

// `trail` is wired into SETS as a per-branch path — resolving it with no branch fails loud.
const { resolvePath } = require("./docs.js");
assert.throws(() => resolvePath("trail"), /needs a branch/, "the trail set requires a branch argument");
assert.deepStrictEqual(
  resolvePath("trail", "feature-yaml-product-memory"),
  { target: ".claude/trails/feature-yaml-product-memory.trail.yaml" },
  "the trail set resolves to a per-branch path",
);

// The t-simple-docs contract, run against the REAL `.claude/roadmap.yaml` (no fixture): shipped rows
// come back as records carrying `row`, `feature`, `status`, `depends_on`, `links`, plus a spec.
//
// The spec field is asserted as `summary` OR `notes`, not as `notes` alone. The roadmap-rework target
// (row 4) replaced the free-text `notes` with a mini-spec `summary` + one-line `status_detail`, and
// rows 1-17 predate it. Asserting `notes` on every row would fail every row authored to the current
// convention, so the contract is "a row carries a spec", which both shapes satisfy.
const shipped = query("roadmap", { status: "✅ shipped" });
assert.ok(shipped.length > 0, "the roadmap has at least one shipped row to return");
for (const row of shipped) {
  assert.equal(row.status, "✅ shipped", "a row returned for the filter is actually shipped");
  for (const field of ["row", "feature", "status", "depends_on", "links"]) {
    assert.ok(field in row, `a roadmap row carries '${field}' — the t-simple-docs contract`);
  }
  assert.ok(
    "summary" in row || "notes" in row,
    `roadmap row ${row.row} carries a spec (\`summary\`, or legacy \`notes\`) — the t-simple-docs contract`,
  );
}

// The t-architecture contract, run against the REAL `.claude/architecture.yaml` (no fixture): the
// named seam comes back with `from`/`to`/`in`/`out` as separate fields.
assert.deepStrictEqual(
  query("architecture", { protocol: "PLAN -> tasks.js" }, { section: "protocols" }),
  [
    {
      protocol: "PLAN -> tasks.js",
      from: "PLAN",
      to: "tasks.js",
      in: "the trail's `tasks:` section, joined with `.claude/tasks/<id>.yaml` state",
      out: "`schedule --json` layers (a cycle = loud failure)",
    },
  ],
  "the PLAN -> tasks.js seam comes back with from/to/in/out fields — the t-architecture contract",
);

// Projection, against the REAL `.claude/lessons.yaml`. Filtering alone still returns each record
// whole — prose `body` and all — so the answer to the question this tool was built for came back at
// 40,530 bytes against a 138,526-byte file. Projected to version+title it is 1,632. The saving is the
// feature, so pin that the projected record carries ONLY the named fields.
{
  const full = query("lessons", { files: "hooks/protocol.md" });
  const projected = query("lessons", { files: "hooks/protocol.md" }, { fields: ["version", "title"] });
  assert.strictEqual(projected.length, full.length, "projection must not drop records, only fields");
  assert(full.length > 0, "the lessons set must actually answer this query");
  for (const record of projected) {
    assert.deepStrictEqual(
      Object.keys(record).sort(),
      ["title", "version"],
      "a projected record carries only the named fields",
    );
  }
  assert(
    JSON.stringify(projected).length * 5 < JSON.stringify(full).length,
    "projection must be a real saving, not a rename",
  );
}

// A requested field a record does not carry is omitted, never emitted as null — the output stays a
// faithful subset of what is on disk rather than inventing keys.
{
  const [record] = query("lessons", { files: "hooks/protocol.md" }, { fields: ["version", "nonesuch"] });
  assert.deepStrictEqual(Object.keys(record), ["version"], "an absent field is omitted, not nulled");
}

// A --fields name NO matching record carries warns on stderr. Without this the query returns a list
// of empty objects, which is indistinguishable from an empty set — the exact silent failure that let
// two wrong commands sit in protocol.md for months. stdout must stay clean so `| jq` still works.
{
  const errors = [];
  const real = console.error;
  console.error = (message) => errors.push(message);
  try {
    query("lessons", { files: "hooks/protocol.md" }, { fields: ["nonesuch"] });
  } finally {
    console.error = real;
  }
  assert.strictEqual(errors.length, 1, "a dead --fields name warns exactly once");
  assert(errors[0].includes("nonesuch"), "the warning names the offending field");

  const quiet = [];
  console.error = (message) => quiet.push(message);
  try {
    query("lessons", { files: "hooks/protocol.md" }, { fields: ["title"] });
  } finally {
    console.error = real;
  }
  assert.strictEqual(quiet.length, 0, "a field the records really carry warns not at all");
}

console.log("docs.js: all checks passed");
