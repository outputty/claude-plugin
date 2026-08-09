#!/usr/bin/env bun
// outputty beads-lite — a per-branch task graph. Adopt the beads *model*, not the `bd` tool.
//
// A task is one YAML list item, in BLOCK style, in .claude/trails/<branch>.tasks.yaml:
//   { "id", "title", "status": "open"|"done", "deps": [ids], "scope": [folders], "brief", "mode"? }
//   `mode` is "afk" (default) or "hitl" — a task that cannot be finished without the human.
// `scope` is the FOLDER a task may work in, not a file list — the builder picks the files.
// Layers are DERIVED from deps, never hand-authored. Full reference: skills/outputty/tasks.md.
//
// Runs on bun for `Bun.YAML.parse`/`Bun.YAML.stringify` — node has no builtin YAML support (verified:
// node v26 throws ERR_UNKNOWN_BUILTIN_MODULE on `node:yaml`, and the installed plugin cache ships no
// node_modules). There is one storage format: real YAML, read and written through `Bun.YAML`.
//
// Deliberate shortcut: single-writer whole-file rewrite; add locking only if writers ever go parallel.

if (typeof Bun === "undefined") {
  throw new Error(
    'tasks.js requires bun (Bun.YAML) — run it with `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" …`',
  );
}

const fs = require("fs");
const { execSync } = require("child_process");

// ---------------------------------------------------------------------------
// Pure graph operations (unit-tested in tasks.test.js)
// ---------------------------------------------------------------------------

// Ids of the tasks that are already finished.
function doneIds(tasks) {
  return new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
}

// Tasks that can be worked right now: open, with every dependency done.
//
// There is deliberately NO same-layer scope check. It existed when a layer was dispatched as a parallel
// per-task fan-out and two tasks writing one file was a real hazard. A layer is now built by ONE agent,
// in sequence, so the hazard is gone — and with `scope` a folder rather than a file list, the check
// would force every task sharing a folder into its own layer, which is the opposite of the 500–700-line
// layers PLAN is told to aim for. Restore it only if task-level parallelism ever comes back.
function ready(tasks) {
  const done = doneIds(tasks);
  return tasks.filter((t) => t.status === "open" && t.deps.every((dep) => done.has(dep)));
}

// The whole plan as ordered layers, in dependency order. Throws on a dependency cycle.
function schedule(tasks) {
  const done = doneIds(tasks);
  let remaining = tasks.filter((t) => t.status !== "done");
  const layers = [];

  while (remaining.length > 0) {
    const layer = remaining.filter((t) => t.deps.every((dep) => done.has(dep)));
    if (layer.length === 0) {
      throw new Error(`cycle or unmet dependency among: ${idList(remaining)}`);
    }

    layers.push(layer);
    layer.forEach((t) => done.add(t.id));
    remaining = remaining.filter((t) => !layer.includes(t));
  }
  return layers;
}

const idList = (tasks) => tasks.map((t) => t.id).join(", ");

// ---------------------------------------------------------------------------
// Storage: one YAML file per branch
// ---------------------------------------------------------------------------

/**
 * Resolve the graph file for the current branch, and say whether it was named EXPLICITLY.
 *
 * `OUTPUTTY_TASKS` names a file directly, so a missing one is a typo, not a fresh branch — it fails
 * loud. The per-branch default is derived, so a missing one just means this branch has no graph yet. A
 * branch name can contain "/" (e.g. "feature/x"); slugified to "-" so the file lands flat beside its
 * siblings rather than at a nested path that never exists.
 *
 * @returns {{ path: string, explicit: boolean }}
 *
 * `taskFile()` on branch "feature/x" -> `{ path: ".claude/trails/feature-x.tasks.yaml", explicit: false }`
 */
function taskFile() {
  if (process.env.OUTPUTTY_TASKS) return { path: process.env.OUTPUTTY_TASKS, explicit: true };
  let branch;
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    throw new Error("not in a git repo — set OUTPUTTY_TASKS to a tasks file, or run inside a branch");
  }
  const slug = branch.replace(/\//g, "-");
  return { path: `.claude/trails/${slug}.tasks.yaml`, explicit: false };
}

/**
 * Load the graph, default the optional fields, and reject duplicate ids (a dup would corrupt readiness).
 *
 * @param {string} file - path to the graph, as resolved by `taskFile()`.
 * @param {boolean} [explicit] - true when the caller named this file directly (OUTPUTTY_TASKS). A
 *   missing explicit graph fails loud — it was asked for by name, so absence is a mistake, not a fresh
 *   branch. A missing derived graph returns `[]` — a brand-new branch legitimately has no tasks yet.
 * @returns {object[]} every task, with `deps`/`scope` defaulted to `[]` when the record omits them.
 * @throws when the file exists but two records share an `id`.
 *
 * `loadTasks(".claude/trails/t.tasks.yaml")` -> `[{ id: "t-1", deps: [], scope: [], ... }]`
 */
function loadTasks(file, explicit = false) {
  if (!fs.existsSync(file)) {
    if (explicit) throw new Error(`task graph not found: ${file}`);
    return [];
  }
  const tasks = Bun.YAML.parse(fs.readFileSync(file, "utf8")).map((t) => ({
    deps: [],
    scope: [],
    ...t,
  }));
  const seen = new Set();
  for (const t of tasks) {
    if (seen.has(t.id)) throw new Error(`duplicate task id: ${t.id}`);
    seen.add(t.id);
  }
  return tasks;
}

/**
 * Write the whole graph back as block-style YAML, one field per line — hand-editable, unlike JSONL.
 *
 * @param {string} file - path to write.
 * @param {object[]} tasks - the full task list (not just the changed one — this is a whole-file rewrite).
 *
 * `saveTasks(f, [{ id: "t-1", ... }])` -> writes `f` as a YAML block-style list.
 */
function saveTasks(file, tasks) {
  const yaml = Bun.YAML.stringify(tasks, null, 2);
  fs.writeFileSync(file, yaml.endsWith("\n") ? yaml : yaml + "\n");
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

  // add <id> <title> [--deps a,b --scope folder --brief "…" --from parent]
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

  // amend <id> [--scope x,y --brief '…'] — widen an open task mid-build.
  //
  // QA can find that a done-condition genuinely needs an edit outside its folder — a scope-negotiation
  // finding, whose stated fix is "a scope amendment". Until 0.30.0 there was nothing to amend it with,
  // so the only route was hand-editing the JSONL, which `require-grill.js` denies in a resumed BUILD
  // session. Widening is the whole point: a task that has already been built cannot have its scope
  // narrowed without orphaning committed work, so `done` tasks are refused outright.
  amend(tasks, { args, file }) {
    const id = args.positional[0];
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error(`no task ${id}`);
    if (task.status === "done") throw new Error(`task ${id} is done — amend orphans committed work`);
    if (args.scope === undefined && args.brief === undefined) {
      throw new Error("amend needs --scope or --brief");
    }
    if (args.scope !== undefined) {
      const added = commaList(args.scope).filter((s) => !task.scope.includes(s));
      if (!added.length) throw new Error(`task ${id} already covers that scope`);
      task.scope = [...task.scope, ...added];
    }
    if (args.brief !== undefined) task.brief = args.brief;
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
      "usage: ready | schedule | add <id> <title> [--deps a,b --scope x,y --brief '…' --from p] | " +
        "amend <id> [--scope x,y --brief '…'] | close <id>  [--json]",
    );
    process.exit(1);
  }

  const json = rest.includes("--json");
  const args = parseArgs(rest.filter((a) => a !== "--json"));

  try {
    const { path: file, explicit } = taskFile();
    command(loadTasks(file, explicit), { args, json, file });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { ready, schedule, commands, taskFile, loadTasks, saveTasks };

if (require.main === module) {
  main(process.argv.slice(2));
}
