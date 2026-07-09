#!/usr/bin/env node
// outputty beads-lite — a per-branch task graph. Adopt the beads *model*, not the `bd` tool.
//
// A task is one line of JSON in .claude/trails/<branch>.tasks.jsonl:
//   { "id", "title", "status": "open"|"done", "deps": [ids], "scope": [paths], "brief" }
// Layers are DERIVED from deps, never hand-authored. Full reference: skills/outputty/tasks.md.
//
// ponytail: single-writer whole-file rewrite; add locking only if writers ever go parallel.

const fs = require("fs");
const { execSync } = require("child_process");

// ---------------------------------------------------------------------------
// Pure graph operations (unit-tested in tasks.test.js)
// ---------------------------------------------------------------------------

// Ids of the tasks that are already finished.
function doneIds(tasks) {
  return new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
}

// No two tasks in the same layer may own the same file path.
function assertNoScopeClash(layer) {
  const owner = {};
  for (const task of layer) {
    for (const path of task.scope || []) {
      if (owner[path]) {
        throw new Error(`scope clash: ${owner[path]} and ${task.id} both touch ${path} — add a dep`);
      }
      owner[path] = task.id;
    }
  }
}

// Tasks that can be worked right now: open, with every dependency done. The unblocked set is a
// single parallel layer, so it must be scope-disjoint too — fail loud if it isn't (a missing dep).
function ready(tasks) {
  const done = doneIds(tasks);
  const result = tasks.filter((t) => t.status === "open" && t.deps.every((dep) => done.has(dep)));
  assertNoScopeClash(result);
  return result;
}

// The whole plan as ordered layers; each layer is a set of tasks safe to run in parallel.
// Throws on a dependency cycle, or on a same-layer scope clash (a missing dependency).
function schedule(tasks) {
  const done = doneIds(tasks);
  let remaining = tasks.filter((t) => t.status !== "done");
  const layers = [];

  while (remaining.length > 0) {
    const layer = remaining.filter((t) => t.deps.every((dep) => done.has(dep)));
    if (layer.length === 0) {
      throw new Error(`cycle or unmet dependency among: ${idList(remaining)}`);
    }
    assertNoScopeClash(layer);

    layers.push(layer);
    layer.forEach((t) => done.add(t.id));
    remaining = remaining.filter((t) => !layer.includes(t));
  }
  return layers;
}

const idList = (tasks) => tasks.map((t) => t.id).join(", ");

// ---------------------------------------------------------------------------
// Storage: one JSONL file per branch
// ---------------------------------------------------------------------------

function taskFile() {
  if (process.env.OUTPUTTY_TASKS) return process.env.OUTPUTTY_TASKS;
  let branch;
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    throw new Error("not in a git repo — set OUTPUTTY_TASKS to a tasks file, or run inside a branch");
  }
  return `.claude/trails/${branch}.tasks.jsonl`;
}

// Load, default the optional fields, and reject duplicate ids (a dup would corrupt readiness).
function loadTasks(file) {
  if (!fs.existsSync(file)) return [];
  const tasks = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => ({ deps: [], scope: [], ...JSON.parse(line) }));
  const seen = new Set();
  for (const t of tasks) {
    if (seen.has(t.id)) throw new Error(`duplicate task id: ${t.id}`);
    seen.add(t.id);
  }
  return tasks;
}

function saveTasks(file, tasks) {
  fs.writeFileSync(file, tasks.map((t) => JSON.stringify(t)).join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const commands = {
  // ready [--json] — the ids ready to work right now.
  ready(tasks, { json }) {
    const result = ready(tasks);
    console.log(json ? JSON.stringify(result) : idList(result) || "(none ready)");
  },

  // schedule [--json] — the derived layer plan.
  schedule(tasks, { json }) {
    const layers = schedule(tasks);
    if (json) {
      console.log(JSON.stringify(layers));
      return;
    }
    const lines = layers.map((layer, i) => `Layer ${i + 1}: ${idList(layer)}`);
    console.log(lines.join("\n") || "(no open tasks)");
  },

  // add <id> <title> [--deps a,b --scope x,y --brief "…" --from parent]
  add(tasks, { args, file }) {
    const [id, title] = args.positional;
    if (!id) throw new Error("add needs an id");
    if (tasks.some((t) => t.id === id)) throw new Error(`task ${id} already exists`);
    tasks.push({
      id,
      title: title || "",
      status: "open",
      deps: commaList(args.deps),
      scope: commaList(args.scope),
      brief: args.brief || "",
      ...(args.from ? { discovered_from: args.from } : {}),
    });
    saveTasks(file, tasks);
  },

  // close <id> — mark a task done.
  close(tasks, { args, file }) {
    const id = args.positional[0];
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error(`no task ${id}`);
    task.status = "done";
    saveTasks(file, tasks);
  },
};

// "a, b," -> ["a", "b"] — trims each item and drops empties.
const commaList = (value) =>
  (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Parse "add foo --deps a,b" into { positional: ["foo"], deps: "a,b" }. A flag with no value
// (next token is another --flag, or absent) is left empty rather than swallowing the next flag.
function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[argv[i].slice(2)] = next;
        i++;
      } else {
        args[argv[i].slice(2)] = "";
      }
    } else {
      args.positional.push(argv[i]);
    }
  }
  return args;
}

function main(argv) {
  const [name, ...rest] = argv;
  const command = commands[name];
  if (!command) {
    console.error(
      "usage: ready | schedule | add <id> <title> [--deps a,b --scope x,y --brief '…' --from p] | close <id>  [--json]",
    );
    process.exit(1);
  }

  const json = rest.includes("--json");
  const args = parseArgs(rest.filter((a) => a !== "--json"));

  try {
    const file = taskFile();
    command(loadTasks(file), { args, json, file });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { ready, schedule };

if (require.main === module) {
  main(process.argv.slice(2));
}
