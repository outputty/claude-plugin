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
  return tasks.filter((t) => t.status === "open" && specSettled(t) && t.deps.every((dep) => done.has(dep)));
}

// The planning lifecycle, and the only thing that decides which stage owns a task.
//
// The two stages run independently and never block each other. PLANNING is human-in-the-loop and
// synchronous: research, grilling, requirements, the plan. BUILD is asynchronous and unattended: a
// sweep looks for `settled` work and dispatches whatever can run in parallel. The queue is the only
// thing between them, so neither waits on the other's session.
//
//   drafting ──► settled ──► (build succeeds) ──► done
//      ▲            │
//      │            └──────► (build hits a requirements gap) ──► replan
//      └───────────────────────────────────────────────────────────┘
//                    a replan is an ITERATION, not a fresh start:
//                    it carries `attempts` so the next build knows what died
const SPEC_STATES = ["drafting", "settled", "replan"];

/**
 * Whether a task's spec is settled enough to build.
 *
 * Only `settled` is buildable. `drafting` has never been through planning; `replan` went through and
 * came back because a build proved the requirements were not concrete enough. Both belong to the
 * planning stage, and the build sweep must skip them rather than guess at what they mean. Absent means
 * settled, so every graph written before this field keeps scheduling unchanged.
 *
 * @param {object} task - a task record.
 * @returns {boolean} true only when the build stage may pick this task up.
 *
 * `specSettled({ spec: "replan" })` -> false. `specSettled({})` -> true.
 */
function specSettled(task) {
  if (task.spec === undefined) return true;
  if (!SPEC_STATES.includes(task.spec)) {
    throw new Error(`unknown spec state '${task.spec}' on task ${task.id} (states: ${SPEC_STATES.join(", ")})`);
  }
  return task.spec === "settled";
}

/**
 * The tasks the planning stage owns: never specced, or sent back by a build that could not proceed.
 *
 * The build sweep uses `ready`; this is its mirror, and the two are disjoint by construction. A task in
 * neither is either `done` or blocked on a dependency.
 * @param {object[]} tasks - every task.
 * @returns {object[]} the tasks awaiting a human-in-the-loop pass.
 *
 * `planning([{id:"a",spec:"replan",status:"open"}])` -> that task.
 */
function planning(tasks) {
  return tasks.filter((t) => t.status === "open" && !specSettled(t));
}

// Model tier -> the FULL model id and reasoning effort a dispatch passes after `--`.
//
// Full ids only, never an alias: `opus` resolves to the LATEST model of that family, so it would
// silently select Opus 5 where tier 3 means Opus 4.8. `effort` here is the reasoning-effort knob a
// charter also sets; the task field is `tier`, which selects the model, so the two never collide.
const TIERS = {
  1: { model: "claude-haiku-4-5-20251001", effort: "medium" },
  2: { model: "claude-sonnet-5", effort: "high" },
  3: { model: "claude-opus-4-8", effort: "high" },
  4: { model: "claude-fable-5", effort: "high" },
};

/**
 * The dispatch flags for a task, from its `tier`.
 *
 * Absent tier means 3, which is what build sessions are pinned to today, so an unlabelled task
 * dispatches exactly as it does now.
 * @param {object} task - a task record.
 * @returns {{model: string, effort: string}} the flags to pass after `--`.
 *
 * `dispatchFlags({ tier: 1 })` -> `{ model: "claude-haiku-4-5-20251001", effort: "medium" }`.
 */
function dispatchFlags(task) {
  const tier = task.tier ?? 3;
  if (!TIERS[tier]) throw new Error(`unknown tier ${tier} on task ${task.id} (tiers: 1, 2, 3, 4)`);
  return TIERS[tier];
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
 * BUILD publishes one branch per LAYER (`feature/x-l1`, `-l2`, …) while the graph is one per FEATURE, so
 * a trailing `-l<N>` layer suffix is stripped before deriving the path — otherwise standing on a layer
 * branch resolves to a path nothing has ever written, and the caller (e.g. `add`) would silently start a
 * second, empty graph beside the real one. If the stripped path still doesn't exist but a graph named
 * `<slug>-l<N>.tasks.yaml` does — the exact artifact a layer branch would have forked before this fix
 * shipped — that is a near-miss worth failing loud over rather than silently creating a second empty
 * graph. The match is anchored to that one pattern, not a bare prefix: a genuinely different feature
 * whose slug happens to prefix another's (`feature-yaml` vs. an existing `feature-yaml-product-memory`)
 * must not be blocked from ever starting its own graph.
 *
 * @returns {{ path: string, explicit: boolean }}
 *
 * `taskFile()` on branch "feature/x-l2" -> `{ path: ".claude/trails/feature-x.tasks.yaml", explicit: false }`
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
  const slug = branch.replace(/\//g, "-").replace(/-l\d+$/, "");
  const dir = ".claude/trails";
  const target = `${dir}/${slug}.tasks.yaml`;
  if (!fs.existsSync(target) && fs.existsSync(dir)) {
    // Anchored to `<slug>-l<N>.tasks.yaml` specifically — see the docstring above for why a bare prefix
    // match is wrong.
    const layerSuffixPrefix = `${slug}-l`;
    const sibling = fs
      .readdirSync(dir)
      .find((f) => f.startsWith(layerSuffixPrefix) && /^\d+\.tasks\.yaml$/.test(f.slice(layerSuffixPrefix.length)));
    if (sibling) {
      throw new Error(
        `no graph at ${target}, but a sibling feature graph exists: ${dir}/${sibling} — ` +
          "rename it to the feature-only path if it's the same feature, or set OUTPUTTY_TASKS to override.",
      );
    }
  }
  return { path: target, explicit: false };
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

  // planning [--json] — the tasks the PLANNING stage owns: never specced, or sent back by a build.
  //
  // The mirror of `ready`. An orchestrator sweep prints both: `ready` is what it may dispatch now,
  // `planning` is what needs a human-in-the-loop pass before it can ever be dispatched.
  planning(tasks, { json }) {
    const result = planning(tasks);
    console.log(json ? JSON.stringify(result) : idList(result) || "(nothing waiting on planning)");
  },

  // dispatch <id> [--json] — the model flags this task should be started with.
  //
  // The orchestrator pastes these after `--` in `herdr agent start`. It exists so the tier-to-model
  // mapping lives in one place that is read by a command, rather than in prose an orchestrator has to
  // remember and re-derive on every dispatch.
  dispatch(tasks, { json, positional }) {
    const id = positional[0];
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error(`no such task: ${id}`);
    const flags = dispatchFlags(task);
    console.log(json ? JSON.stringify(flags) : `--model ${flags.model} --effort ${flags.effort}`);
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
  // so the only route was hand-editing the JSONL — off-protocol, unvalidated, and easy to corrupt.
  // Widening is the whole point: a task that has already been built cannot have its scope
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
      "usage: ready | planning | dispatch <id> | schedule | add <id> <title> [--deps a,b --scope x,y --brief '…' --from p] | " +
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

module.exports = {
  ready,
  planning,
  schedule,
  commands,
  taskFile,
  loadTasks,
  saveTasks,
  specSettled,
  dispatchFlags,
  TIERS,
  SPEC_STATES,
};

if (require.main === module) {
  main(process.argv.slice(2));
}
