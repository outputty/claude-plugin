#!/usr/bin/env node
// outputty init installer. Run from the repo root: node "$CLAUDE_PLUGIN_ROOT/skills/init/install.mjs"
//
// Installs the plugin's templates into the current repo, idempotently, and prints one line per file:
//   CLAUDE.md                  the managed block between its markers is replaced; text outside is untouched
//   .claude/rules/*.md         created when absent, kept when present (they hold the repo's own corrections)
//   .claude/*.md               product docs, same rule
//   .github/*                  issue and PR templates, same rule
//   .claude/settings.json      templates/settings.json deep-merged; allow/deny/ask union, other keys set
// Runs no git command. Exits non-zero with the file named on any problem.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const plugin = process.env.CLAUDE_PLUGIN_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const templates = join(plugin, "templates");
const BEGIN = "<!-- outputty:begin";
const END = "<!-- outputty:end -->";

/** Reads a template or exits naming the missing file. */
function template(name) {
  const path = join(templates, name);
  if (!existsSync(path)) fail(`missing template ${path}`);
  return readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`install.mjs: ${message}`);
  process.exit(1);
}

/** Replaces the managed block in CLAUDE.md, appends it, or creates the file. */
function installBlock() {
  const block = template("CLAUDE.block.md");
  if (!existsSync("CLAUDE.md")) {
    writeFileSync("CLAUDE.md", block);
    return report("CLAUDE.md", "created");
  }
  const current = readFileSync("CLAUDE.md", "utf8");
  const start = current.indexOf(BEGIN);
  const end = current.indexOf(END);
  if (start >= 0 && end > start) {
    const after = current.slice(end + END.length).replace(/^\n/, "");
    writeFileSync("CLAUDE.md", current.slice(0, start) + block + after);
    return report("CLAUDE.md", "block replaced, text outside the markers untouched");
  }
  writeFileSync("CLAUDE.md", current.replace(/\n*$/, "\n\n") + block);
  report("CLAUDE.md", "block appended");
}

/** Copies a template to its destination only when the destination does not exist. */
function copyIfAbsent(name, destination) {
  const source = template(name);
  mkdirSync(dirname(destination), { recursive: true });
  if (!existsSync(destination)) {
    writeFileSync(destination, source);
    return report(destination, "created");
  }
  const same = readFileSync(destination, "utf8") === source;
  report(destination, same ? "unchanged" : `kept, differs from templates/${name}`);
}

/** Deep-merges templates/settings.json into .claude/settings.json; allow, deny and ask union. */
function mergeSettings() {
  const destination = ".claude/settings.json";
  const patch = JSON.parse(template("settings.json"));
  let base = {};
  if (existsSync(destination)) {
    try {
      base = JSON.parse(readFileSync(destination, "utf8"));
    } catch (error) {
      fail(`${destination} is not valid JSON. Fix it by hand, then run this again. ${error.message}`);
    }
  }
  mkdirSync(".claude", { recursive: true });
  writeFileSync(destination, JSON.stringify(merge(base, patch), null, 2) + "\n");
  report(destination, "templates/settings.json merged, other keys preserved");
}

const UNION = new Set(["allow", "deny", "ask"]);
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function merge(base, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      const had = Array.isArray(base[key]) ? base[key] : [];
      base[key] = UNION.has(key) ? [...new Set([...had, ...value])] : value;
    } else if (isObject(value)) {
      base[key] = merge(isObject(base[key]) ? base[key] : {}, value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

function report(path, what) {
  console.log(`${relative(process.cwd(), path) || path}: ${what}`);
}

installBlock();
for (const rule of ["code", "docs", "issues"]) copyIfAbsent(`rules/${rule}.md`, `.claude/rules/${rule}.md`);
for (const doc of ["product", "roadmap", "architecture", "examples"])
  copyIfAbsent(`docs/${doc}.md`, `.claude/${doc}.md`);
copyIfAbsent("ISSUE_TEMPLATE/task.md", ".github/ISSUE_TEMPLATE/task.md");
copyIfAbsent("PULL_REQUEST_TEMPLATE.md", ".github/PULL_REQUEST_TEMPLATE.md");
mergeSettings();
