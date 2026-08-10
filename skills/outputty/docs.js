#!/usr/bin/env bun
/**
 * docs.js — answer a query against a product-memory YAML record set without reading the file whole.
 *
 * Runs on bun for `Bun.YAML.parse` — node has no builtin YAML support (verified: node v26 throws
 * ERR_UNKNOWN_BUILTIN_MODULE on `node:yaml`, and the installed plugin cache ships no node_modules).
 * Read-only: this tool never writes a doc — that stays a human/agent edit of the YAML text.
 *
 * A "file" set is either one YAML list, one record per list item (roadmap, lessons, examples), or a
 * MAPPING of named sections — prose sections as `|` blocks alongside record-list sections (product,
 * architecture) — queried with `--section <name>`. A "dir" set is one record per file, aggregated
 * (claims: one external fact per file, so validating one doesn't touch the rest). `trail` is a "file"
 * set whose path is per-branch, so it takes the branch as a positional argument. See
 * references/product-template.md for the shape of each set.
 */

if (typeof Bun === "undefined") {
  throw new Error("docs.js requires bun (Bun.YAML.parse) — run it with `bun skills/outputty/docs.js …`");
}

const fs = require("fs");
const path = require("path");

const SETS = {
  product: { kind: "file", path: ".claude/product.yaml" },
  roadmap: { kind: "file", path: ".claude/roadmap.yaml" },
  architecture: { kind: "file", path: ".claude/architecture.yaml" },
  lessons: { kind: "file", path: ".claude/lessons.yaml" },
  examples: { kind: "file", path: ".claude/examples.yaml" },
  claims: { kind: "dir", path: ".claude/claims" },
  // A trail is per-branch, so its path is derived from the `branch` positional the CLI passes through —
  // there is no single ".claude/trails.yaml" to point at. Every writer of a trail must name the same
  // file: writers saying `<branch>.md` while readers say `<branch>.trail.yaml` shipped once and denied
  // a properly grilled spec's task graph. `driver.mjs` now greps for that form.
  trail: { kind: "trail", path: ".claude/trails" },
};

/**
 * Resolve the file/directory a record set reads from.
 *
 * `OUTPUTTY_DOCS` overrides the resolved path for any set — the fixture seam `docs.test.js` uses,
 * mirroring `tasks.js`'s `OUTPUTTY_TASKS`. An override always behaves as a single "file" set: tests
 * query one fixture list, not a directory of fixtures.
 *
 * @param {string} set - a key of SETS.
 * @param {string} [branch] - required only for the `trail` set, whose path is per-branch.
 * @returns {{ target: string, kind: "file"|"dir" }}
 * @throws when `set` names no known record set, or `trail` is queried with no branch.
 *
 * `resolvePath("lessons")` -> `{ target: ".claude/lessons.yaml", kind: "file" }`
 */
function resolvePath(set, branch) {
  if (process.env.OUTPUTTY_DOCS) return { target: process.env.OUTPUTTY_DOCS, kind: "file" };
  const known = SETS[set];
  if (!known) throw new Error(`unknown record set: ${set} (known: ${Object.keys(SETS).join(", ")})`);
  if (known.kind === "trail") {
    if (!branch) throw new Error("the trail set needs a branch: docs.js trail <branch> [--section <name>] ...");
    return { target: `${known.path}/${branch}.trail.yaml`, kind: "file" };
  }
  return { target: known.path, kind: known.kind };
}

/**
 * Load a set's content into memory — a flat record list, or one section of a mapping set.
 *
 * A "dir" set reads every `.yaml`/`.yml` file in the directory and parses each as one record — the
 * directory itself is never read as a single YAML document. Raises if the resolved path is missing, or
 * if a "dir" set exists but holds no YAML file yet (e.g. `claims/` still holding only `.md` — not
 * converted, not empty): a query against a set that was never created is a mistake, not an empty result.
 *
 * A "file" set may parse to a YAML **list** (unchanged: returned as-is) or a **mapping** — the shape
 * `product`, `architecture` and `trail` use for prose sections (`|` blocks) alongside record sections
 * (per `references/product-template.md`). A mapping set requires `opts.section`; a missing or omitted
 * section fails loud naming the sections that do exist, rather than a raw `TypeError` from treating a
 * mapping as a list.
 *
 * @param {string} set - a key of SETS, or any name when `OUTPUTTY_DOCS` is set.
 * @param {{ section?: string, branch?: string }} [opts] - `section` selects a mapping set's section;
 *   `branch` resolves the `trail` set's per-branch path.
 * @returns {object[]|string} the section's records, a prose section's text, or the whole list.
 *
 * `loadRecords("lessons")` -> the full list of lesson records from `.claude/lessons.yaml`.
 * `loadRecords("product", { section: "language" })` -> the Language glossary's term records.
 */
function loadRecords(set, opts = {}) {
  const { target, kind } = resolvePath(set, opts.branch);
  if (kind === "dir") {
    const entries = fs.readdirSync(target);
    const yamlFiles = entries.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    if (yamlFiles.length === 0 && entries.length > 0) {
      throw new Error(`no YAML records in ${target} — not converted from markdown yet?`);
    }
    return yamlFiles.sort().map((f) => Bun.YAML.parse(fs.readFileSync(path.join(target, f), "utf8")));
  }
  const parsed = Bun.YAML.parse(fs.readFileSync(target, "utf8"));
  if (Array.isArray(parsed)) return parsed;
  const sections = Object.keys(parsed);
  if (!opts.section) {
    throw new Error(`${set} is a sectioned set — pass --section (sections: ${sections.join(", ")})`);
  }
  if (!(opts.section in parsed)) {
    throw new Error(`${set} has no section '${opts.section}' (sections: ${sections.join(", ")})`);
  }
  return parsed[opts.section];
}

/**
 * Report whether one record satisfies every requested filter.
 *
 * An array field (e.g. `files`, `deps`) matches by containment — the filter value must appear in the
 * list. A scalar field matches by string equality.
 *
 * @param {object} record - one parsed YAML record.
 * @param {Record<string,string>} filters - field name -> the value it must equal or contain.
 * @returns {boolean}
 *
 * `matches({ files: ["a.md"] }, { files: "a.md" })` -> true
 */
function matches(record, filters) {
  return Object.entries(filters).every(([field, value]) => {
    const actual = record[field];
    if (Array.isArray(actual)) return actual.includes(value);
    return String(actual) === value;
  });
}

/**
 * Answer a query against a record set — the whole point: filter without reading the file whole.
 *
 * A prose section (`loadRecords` returns a string) has no fields to filter, so it is returned verbatim
 * regardless of `filters`.
 *
 * @param {string} set - a key of SETS.
 * @param {Record<string,string>} filters - field name -> required value.
 * @param {{ section?: string, branch?: string }} [opts] - see `loadRecords`.
 * @returns {object[]|string} the matching records, in file order, or a prose section's text.
 *
 * `query("lessons", { files: "hooks/protocol.md" })` -> the lesson records that touched that path.
 */
function query(set, filters, opts = {}) {
  const records = loadRecords(set, opts);
  if (typeof records === "string") return records;
  const hits = records.filter((record) => matches(record, filters));
  return opts.fields ? hits.map((record) => project(record, opts.fields)) : hits;
}

/**
 * Keep only the named fields of a record.
 *
 * Filtering alone still returns every record whole, prose `body` blocks included. Measured on the
 * question this tool was built for — which lessons touched `hooks/protocol.md` — the filtered answer
 * was 40,530 bytes against a 138,526-byte file, a 3.4x saving; the same answer projected to
 * `version,title` is 1,632 bytes, an 85x saving. Projection is what makes the query cheap to read.
 *
 * A requested field the record does not carry is omitted rather than emitted as null, so the output
 * stays a faithful subset of what is on disk.
 *
 * @param {object} record - one parsed YAML record.
 * @param {string[]} fields - field names to keep, in the order given.
 * @returns {object} a new record holding only those fields.
 *
 * `project({ version: "0.46.0", title: "X", body: "…" }, ["version", "title"])`
 *   -> `{ version: "0.46.0", title: "X" }`
 */
function project(record, fields) {
  const out = {};
  for (const field of fields) if (field in record) out[field] = record[field];
  return out;
}

/**
 * Split a raw argv into the set name, its positional args, and its flags.
 *
 * `parseArgs(["lessons", "--files", "hooks/protocol.md", "--fields", "version,title", "--json"])` ->
 * `{ set: "lessons", positional: [], section: undefined, fields: ["version","title"],
 *    filters: { files: "hooks/protocol.md" }, json: true }`
 */
function parseArgs(argv) {
  const [set, ...rest] = argv;
  const filters = {};
  const positional = [];
  let section;
  let fields;
  let json = false;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--json") {
      json = true;
      continue;
    }
    if (rest[i] === "--section") {
      section = rest[i + 1];
      i++;
      continue;
    }
    if (rest[i] === "--fields") {
      fields = rest[i + 1]
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      i++;
      continue;
    }
    if (rest[i].startsWith("--")) {
      filters[rest[i].slice(2)] = rest[i + 1];
      i++;
      continue;
    }
    positional.push(rest[i]);
  }
  return { set, positional, section, fields, filters, json };
}

function main(argv) {
  const { set, positional, section, fields, filters, json } = parseArgs(argv);
  if (!set)
    throw new Error(
      "usage: docs.js <set> [<branch>] [--section <name>] [--<field> <value> ...] [--fields a,b] [--json]",
    );
  const results = query(set, filters, { section, fields, branch: positional[0] });
  if (typeof results === "string") {
    console.log(json ? JSON.stringify(results) : results);
    return;
  }
  if (json) {
    console.log(JSON.stringify(results));
    return;
  }
  console.log(results.map((r) => JSON.stringify(r)).join("\n") || "(no matching records)");
}

module.exports = { query, matches, loadRecords, resolvePath, SETS };

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
