#!/usr/bin/env node
// outputty beads-lite — a per-branch task graph. Adopt the beads *model*, not the `bd` tool.
// The pure graph ops (schedule/ready) below are unit-tested in tasks.test.mjs; the CLI just wraps I/O.
// ponytail: single-writer whole-file rewrite over one JSONL; add locking only if writers ever go parallel.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const doneIds = (tasks) => new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));

export const ready = (tasks) => {
  const done = doneIds(tasks);
  return tasks.filter((t) => t.status === "open" && t.deps.every((d) => done.has(d)));
};

// Derive the full layer schedule from the dependency graph. Rejects cycles and, per layer,
// a scope clash between two ready tasks (two tasks touching one file = a missing dependency).
export function schedule(tasks) {
  const layers = [];
  const done = doneIds(tasks);
  let pool = tasks.filter((t) => t.status !== "done");
  while (pool.length) {
    const layer = pool.filter((t) => t.deps.every((d) => done.has(d)));
    if (!layer.length) throw new Error("cycle or unmet dep among: " + pool.map((t) => t.id).join(","));
    const owner = {};
    for (const t of layer)
      for (const s of t.scope || []) {
        if (owner[s]) throw new Error(`scope clash in one layer: ${owner[s]} & ${t.id} both touch ${s} — add a dep`);
        owner[s] = t.id;
      }
    layers.push(layer);
    for (const t of layer) done.add(t.id);
    pool = pool.filter((t) => !layer.includes(t));
  }
  return layers;
}

// --- CLI (skipped when this module is imported, e.g. by tasks.test.mjs) ---
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const [cmd, ...rest] = process.argv.slice(2);
  const json = rest.includes("--json");
  const opt = (k) => {
    const i = rest.indexOf(k);
    return i < 0 ? undefined : rest[i + 1];
  };
  const die = (m) => {
    console.error(m);
    process.exit(1);
  };
  const file =
    process.env.OUTPUTTY_TASKS ||
    `.claude/trails/${execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim()}.tasks.jsonl`;
  const tasks = existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map(JSON.parse) : [];
  const save = () => writeFileSync(file, tasks.map((t) => JSON.stringify(t)).join("\n") + "\n");
  try {
    switch (cmd) {
      case "ready": {
        const r = ready(tasks);
        console.log(json ? JSON.stringify(r) : r.map((t) => t.id).join(" ") || "(none ready)");
        break;
      }
      case "schedule": {
        const layers = schedule(tasks);
        console.log(
          json
            ? JSON.stringify(layers)
            : layers.map((l, i) => `Layer ${i + 1}: ${l.map((t) => t.id).join(", ")}`).join("\n") || "(no open tasks)"
        );
        break;
      }
      case "add": {
        if (!rest[0]) die("add needs an id");
        tasks.push({
          id: rest[0],
          title: rest[1] || "",
          status: "open",
          deps: (opt("--deps") || "").split(",").filter(Boolean),
          scope: (opt("--scope") || "").split(",").filter(Boolean),
          brief: opt("--brief") || "",
          ...(opt("--from") ? { discovered_from: opt("--from") } : {}),
        });
        save();
        break;
      }
      case "close": {
        const t = tasks.find((x) => x.id === rest[0]) || die(`no task ${rest[0]}`);
        t.status = "done";
        save();
        break;
      }
      default:
        die("usage: ready | schedule | add <id> <title> [--deps a,b --scope x,y --brief '…' --from p] | close <id>  [--json]");
    }
  } catch (e) {
    die(e.message);
  }
}
