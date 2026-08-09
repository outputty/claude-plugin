// self-check for docs.js. Runs on bun for Bun.YAML.parse. Run: bun skills/outputty/docs.test.js
const assert = require("assert").strict;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { query, matches } = require("./docs.js");

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

// A "dir" set whose directory exists but holds no `.yaml` yet (claims/ today: two `.md` files, no YAML)
// fails loud too — a bare `readdirSync` + filter would silently return `[]`, indistinguishable from a
// genuinely empty, already-converted set.
assert.throws(
  () => query("claims", {}),
  /not converted from markdown yet/,
  "an un-converted dir set is refused, not silently empty",
);

console.log("docs.js: all checks passed");
