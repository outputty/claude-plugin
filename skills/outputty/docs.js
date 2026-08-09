#!/usr/bin/env bun
/**
 * docs.js — answer a query against a product-memory YAML record set without reading the file whole.
 *
 * Runs on bun for `Bun.YAML.parse` — node has no builtin YAML support (verified: node v26 throws
 * ERR_UNKNOWN_BUILTIN_MODULE on `node:yaml`, and the installed plugin cache ships no node_modules).
 * Read-only: this tool never writes a doc — that stays a human/agent edit of the YAML text.
 *
 * A "file" set is one YAML list, one record per list item (product, roadmap, architecture, lessons,
 * examples). A "dir" set is one record per file, aggregated (claims: one external fact per file, so
 * validating one doesn't touch the rest). See references/product-template.md for the record shape of
 * each set.
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
};

/**
 * Resolve the file/directory a record set reads from.
 *
 * `OUTPUTTY_DOCS` overrides the resolved path for any set — the fixture seam `docs.test.js` uses,
 * mirroring `tasks.js`'s `OUTPUTTY_TASKS`. An override always behaves as a single "file" set: tests
 * query one fixture list, not a directory of fixtures.
 *
 * @param {string} set - a key of SETS.
 * @returns {{ target: string, kind: "file"|"dir" }}
 * @throws when `set` names no known record set.
 *
 * `resolvePath("lessons")` -> `{ target: ".claude/lessons.yaml", kind: "file" }`
 */
function resolvePath(set) {
  if (process.env.OUTPUTTY_DOCS) return { target: process.env.OUTPUTTY_DOCS, kind: "file" };
  const known = SETS[set];
  if (!known) throw new Error(`unknown record set: ${set} (known: ${Object.keys(SETS).join(", ")})`);
  return { target: known.path, kind: known.kind };
}

/**
 * Load every record of a set into memory as plain objects.
 *
 * A "dir" set reads every `.yaml`/`.yml` file in the directory and parses each as one record — the
 * directory itself is never read as a single YAML document. Raises if the resolved path is missing, or
 * if a "dir" set exists but holds no YAML file yet (e.g. `claims/` still holding only `.md` — not
 * converted, not empty): a query against a set that was never created is a mistake, not an empty result.
 *
 * @param {string} set - a key of SETS, or any name when `OUTPUTTY_DOCS` is set.
 * @returns {object[]} every record in the set, in file order.
 *
 * `loadRecords("lessons")` -> the full list of lesson records from `.claude/lessons.yaml`.
 */
function loadRecords(set) {
  const { target, kind } = resolvePath(set);
  if (kind === "dir") {
    const entries = fs.readdirSync(target);
    const yamlFiles = entries.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    if (yamlFiles.length === 0 && entries.length > 0) {
      throw new Error(`no YAML records in ${target} — not converted from markdown yet?`);
    }
    return yamlFiles.sort().map((f) => Bun.YAML.parse(fs.readFileSync(path.join(target, f), "utf8")));
  }
  return Bun.YAML.parse(fs.readFileSync(target, "utf8"));
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
 * @param {string} set - a key of SETS.
 * @param {Record<string,string>} filters - field name -> required value.
 * @returns {object[]} the matching records, in file order.
 *
 * `query("lessons", { files: "hooks/protocol.md" })` -> the lesson records that touched that file.
 */
function query(set, filters) {
  return loadRecords(set).filter((record) => matches(record, filters));
}

/** Split `["lessons", "--files", "hooks/protocol.md", "--json"]` into set/filters/json. */
function parseArgs(argv) {
  const [set, ...rest] = argv;
  const filters = {};
  let json = false;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--json") {
      json = true;
      continue;
    }
    if (rest[i].startsWith("--")) {
      filters[rest[i].slice(2)] = rest[i + 1];
      i++;
    }
  }
  return { set, filters, json };
}

function main(argv) {
  const { set, filters, json } = parseArgs(argv);
  if (!set) throw new Error("usage: docs.js <set> [--<field> <value> ...] [--json]");
  const results = query(set, filters);
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
