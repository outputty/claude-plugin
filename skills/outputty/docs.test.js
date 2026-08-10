// self-check for docs.js. Runs on bun for Bun.YAML.parse. Run: bun skills/outputty/docs.test.js
const assert = require("assert").strict;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { query, matches, SETS } = require("./docs.js");

// The canonical worked example — `.claude/examples.md` "A product-doc query".
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

// A "dir" set whose directory exists but holds no `.yaml` yet fails loud rather than silently
// returning `[]` (indistinguishable from a genuinely empty, already-converted set). Pinned against a
// throwaway fixture directory — not the live `.claude/claims/`, which this migration converts to
// YAML — so the property survives the conversion instead of asserting against a moving target.
const staleClaimsDir = fs.mkdtempSync(path.join(os.tmpdir(), "docs-test-claims-"));
fs.writeFileSync(path.join(staleClaimsDir, "old-claim.md"), "# Claim: stale\n");
const realClaimsPath = SETS.claims.path;
SETS.claims.path = staleClaimsDir;
assert.throws(
  () => query("claims", {}),
  /not converted from markdown yet/,
  "an un-converted dir set is refused, not silently empty",
);
SETS.claims.path = realClaimsPath;

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
  { target: ".claude/trails/feature-yaml-product-memory.trail.yaml", kind: "file" },
  "the trail set resolves to a per-branch path",
);

// The t-simple-docs contract, run against the REAL `.claude/roadmap.yaml` (no fixture): shipped rows
// come back as records with `feature`, `status`, `depends_on`, `notes`.
const shipped = query("roadmap", { status: "✅ shipped" });
assert.ok(shipped.length > 0, "the roadmap has at least one shipped row to return");
for (const row of shipped) {
  assert.equal(row.status, "✅ shipped", "a row returned for the filter is actually shipped");
  for (const field of ["feature", "status", "depends_on", "notes"]) {
    assert.ok(field in row, `a roadmap row carries '${field}' — the t-simple-docs contract`);
  }
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
      in: "a `.tasks.yaml` graph",
      out: "`schedule --json` layers (cycle/scope-clash = loud failure)",
    },
  ],
  "the PLAN -> tasks.js seam comes back with from/to/in/out fields — the t-architecture contract",
);

console.log("docs.js: all checks passed");
