#!/usr/bin/env node
// outputty driver — exercises the plugin's executable surface end to end.
//
// outputty has no GUI and no server. Its runnable surface is (a) seven hook scripts that speak the
// Claude Code hook protocol over stdin/stdout, and (b) the tasks.js graph engine that BUILD drains.
// Both are pure processes, so the "app" is driven by feeding them realistic payloads and asserting
// on what comes back — which is exactly what this does.
//
//   node .claude/skills/run-outputty/driver.mjs            # everything
//   node .claude/skills/run-outputty/driver.mjs hooks      # hook contracts only
//   node .claude/skills/run-outputty/driver.mjs tasks      # graph engine only
//   node .claude/skills/run-outputty/driver.mjs wiring     # hooks.json ↔ disk agreement
//   node .claude/skills/run-outputty/driver.mjs gate       # prettier + oxlint
//
// Exit 0 = every check passed. Exit 1 = at least one failed; each failure prints what it expected.
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const results = [];
let currentGroup = "";

const group = (name) => (currentGroup = name);
function check(name, fn) {
  try {
    const detail = fn();
    results.push({ group: currentGroup, name, ok: true, detail });
  } catch (e) {
    results.push({ group: currentGroup, name, ok: false, detail: e.message });
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/**
 * Run a hook with a JSON payload on stdin.
 * @param {string} hook - file name under hooks/, e.g. "session.js".
 * @param {object} payload - the hook input.
 * @param {object} [env] - extra environment variables.
 * @param {string} [cwd] - working directory for the hook process.
 * @returns {{code: number, out: string, json: object|null}} exit code, raw stdout, parsed JSON if any.
 */
function runHook(hook, payload, env = {}, cwd = ROOT) {
  let out = "";
  let code = 0;
  try {
    out = execFileSync("node", [join(ROOT, "hooks", hook)], {
      input: JSON.stringify(payload),
      env: { ...process.env, ...env },
      cwd,
      encoding: "utf8",
      timeout: 15000,
    });
  } catch (e) {
    code = e.status ?? 1;
    out = (e.stdout || "").toString();
  }
  let json = null;
  try {
    json = JSON.parse(out);
  } catch {
    /* many hooks emit prose or nothing — not an error */
  }
  return { code, out, json };
}

const decisionOf = (r) => r.json?.hookSpecificOutput?.permissionDecision ?? null;
const contextOf = (r) => r.json?.hookSpecificOutput?.additionalContext ?? null;

/** A throwaway git repo, so gating hooks can be driven against a real work tree. */
function tempRepo(withRemote = false) {
  const dir = mkdtempSync(join(tmpdir(), "outputty-driver-"));
  execSync("git init -q .", { cwd: dir });
  if (withRemote) execSync("git remote add origin https://github.com/x/y.git", { cwd: dir });
  // Return the path git itself reports. On macOS mkdtemp yields /var/... while git canonicalises to
  // /private/var/... — and memory-recall keys the memory directory off the git root, so using the
  // uncanonical path would make every memory lookup miss and read as a plugin bug.
  return execSync("git rev-parse --show-toplevel", { cwd: dir, encoding: "utf8" }).trim();
}

// ---------------------------------------------------------------------------
// Hook contracts
// ---------------------------------------------------------------------------
function hooks() {
  group("hooks");

  check("session.js injects the protocol in a healthy repo", () => {
    const r = runHook("session.js", {});
    assert(r.code === 0, `exit ${r.code}`);
    assert(r.out.includes("OUTPUTTY"), "no protocol banner in stdout");
    return `${r.out.length} chars injected (~${Math.round(r.out.length / 4)} est. tokens/session)`;
  });

  check("session.js stays silent for a subagent", () => {
    const r = runHook("session.js", { agent_id: "a1", agent_type: "outputty-builder" });
    assert(r.out.trim() === "", `expected no output, got ${r.out.length} chars`);
    return "subagents pay nothing";
  });

  check("session.js warns when the environment is incomplete", () => {
    const dir = tempRepo(false);
    try {
      const r = runHook("session.js", {}, { CLAUDE_PROJECT_DIR: dir }, dir);
      assert(r.out.includes("environment incomplete"), "no warning banner");
      assert(r.out.includes("git remote"), "missing remote not reported");
      return "reports the missing capability, does not inject the protocol";
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  check("require-environment.js denies outside a git repo", () => {
    const dir = mkdtempSync(join(tmpdir(), "outputty-nogit-"));
    try {
      const r = runHook(
        "require-environment.js",
        { tool_input: { file_path: `${dir}/x.txt` } },
        { CLAUDE_PROJECT_DIR: dir },
        dir,
      );
      assert(decisionOf(r) === "deny", `expected deny, got ${decisionOf(r)}`);
      return "deny";
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  check("require-environment.js allows inside a git repo (no OpenWolf needed)", () => {
    const dir = tempRepo();
    try {
      const r = runHook(
        "require-environment.js",
        { tool_input: { file_path: `${dir}/x.txt` } },
        { CLAUDE_PROJECT_DIR: dir },
        dir,
      );
      assert(r.out.trim() === "", `expected silence, got: ${r.out.slice(0, 80)}`);
      return "silent = allowed";
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  check("correction-signal.js fires on a real correction", () => {
    const fired = [
      "no, that's not what I asked for",
      "that doesn't work",
      "why did you commit that?",
      "I said use SVG",
      "revert that change",
    ];
    const missed = fired.filter((p) => !contextOf(runHook("correction-signal.js", { prompt_text: p })));
    assert(missed.length === 0, `did not fire on: ${JSON.stringify(missed)}`);
    return `${fired.length}/${fired.length} corrections detected`;
  });

  check("correction-signal.js stays silent on ordinary instructions", () => {
    const quiet = [
      "don't add a dependency for this",
      "no rush on this one",
      "merge the PR",
      "make sure the readme is correct",
      "get rid of the old path",
    ];
    const noisy = quiet.filter((p) => contextOf(runHook("correction-signal.js", { prompt_text: p })));
    assert(noisy.length === 0, `false positives on: ${JSON.stringify(noisy)}`);
    return `${quiet.length}/${quiet.length} ordinary prompts ignored`;
  });

  check("memory-recall.js surfaces a memory that names the file", () => {
    const repo = tempRepo();
    const memDir = join(process.env.HOME, ".claude", "projects", repo.replace(/[^a-zA-Z0-9]/g, "-"), "memory");
    mkdirSync(memDir, { recursive: true });
    const probe = join(memDir, "zz-driver-probe.md");
    writeFileSync(probe, "---\nname: probe\ndescription: driver probe naming widget.ts\n---\nnote about widget.ts\n");
    try {
      const r = runHook("memory-recall.js", { cwd: repo, tool_input: { file_path: join(repo, "src", "widget.ts") } });
      assert(contextOf(r)?.includes("zz-driver-probe"), "memory not surfaced");
      return "matched on filename";
    } finally {
      rmSync(probe, { force: true });
      rmSync(repo, { recursive: true, force: true });
    }
  });

  check("memory-recall.js resolves the memory dir from the GIT ROOT, not cwd", () => {
    const repo = tempRepo();
    const memDir = join(process.env.HOME, ".claude", "projects", repo.replace(/[^a-zA-Z0-9]/g, "-"), "memory");
    mkdirSync(memDir, { recursive: true });
    const probe = join(memDir, "zz-driver-probe2.md");
    writeFileSync(probe, "---\nname: probe2\ndescription: driver probe naming widget.ts\n---\nwidget.ts\n");
    const sub = join(repo, "packages", "deep");
    mkdirSync(sub, { recursive: true });
    try {
      // cwd is a SUBDIRECTORY — a cwd-keyed lookup finds nothing, a git-root-keyed one finds the memory
      const r = runHook("memory-recall.js", { cwd: sub, tool_input: { file_path: join(repo, "src", "widget.ts") } });
      assert(contextOf(r)?.includes("zz-driver-probe2"), "subdirectory session found no memory — cwd-keyed regression");
      return "git-root keyed";
    } finally {
      rmSync(probe, { force: true });
      rmSync(repo, { recursive: true, force: true });
    }
  });

  check("memory-recall.js is silent with no matching memory, and never blocks", () => {
    const r = runHook("memory-recall.js", {
      cwd: ROOT,
      tool_input: { file_path: "/nonexistent/zzz-no-memory-names-this.txt" },
    });
    assert(r.code === 0, `exit ${r.code}`);
    assert(r.out.trim() === "", "emitted output with no match");
    assert(decisionOf(r) === null, "a memory aid must never emit a permissionDecision");
    return "silent, exit 0, no decision";
  });

  check("block-dangerous-commands.js denies a destructive command", () => {
    const r = runHook("block-dangerous-commands.js", { tool_name: "Bash", tool_input: { command: "rm -rf /" } });
    assert(decisionOf(r) === "deny", `expected deny, got ${decisionOf(r)}`);
    return "deny";
  });

  check("block-dangerous-commands.js leaves a benign command alone", () => {
    const r = runHook("block-dangerous-commands.js", { tool_name: "Bash", tool_input: { command: "git status" } });
    assert(decisionOf(r) !== "deny", "denied a benign command");
    return decisionOf(r) ?? "no decision (defers to the permission flow)";
  });

  check("scan-secrets.js asks before writing a credential", () => {
    const r = runHook("scan-secrets.js", {
      tool_name: "Write",
      tool_input: {
        file_path: "/tmp/x.ts",
        content: 'const k = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
      },
    });
    assert(["ask", "deny"].includes(decisionOf(r)), `expected ask/deny, got ${decisionOf(r)}`);
    return decisionOf(r);
  });

  check("guard-secret-files.js denies reading a .env", () => {
    const r = runHook("guard-secret-files.js", { tool_name: "Read", tool_input: { file_path: `${ROOT}/.env` } });
    assert(decisionOf(r) === "deny", `expected deny, got ${decisionOf(r)}`);
    return "deny";
  });

  check("every hook survives an empty payload", () => {
    const names = [
      "session.js",
      "correction-signal.js",
      "memory-recall.js",
      "require-environment.js",
      "block-dangerous-commands.js",
      "scan-secrets.js",
      "guard-secret-files.js",
    ];
    const bad = names.filter((h) => runHook(h, {}).code !== 0);
    assert(bad.length === 0, `non-zero exit: ${JSON.stringify(bad)}`);
    return `${names.length}/${names.length} exit 0`;
  });

  check("every hook survives malformed stdin", () => {
    const names = ["session.js", "correction-signal.js", "memory-recall.js"];
    const bad = [];
    for (const h of names) {
      try {
        execFileSync("node", [join(ROOT, "hooks", h)], {
          input: "not json{",
          encoding: "utf8",
          cwd: ROOT,
          timeout: 15000,
        });
      } catch (e) {
        if ((e.status ?? 1) !== 0) bad.push(h);
      }
    }
    assert(bad.length === 0, `crashed on malformed stdin: ${JSON.stringify(bad)}`);
    return "malformed stdin is survivable";
  });
}

// ---------------------------------------------------------------------------
// Task graph engine
// ---------------------------------------------------------------------------
const tasksJs = () => join(ROOT, "skills", "outputty", "tasks.js");

function runTasks(args, file) {
  return execFileSync("node", [tasksJs(), ...args], {
    env: { ...process.env, OUTPUTTY_TASKS: file },
    cwd: ROOT,
    encoding: "utf8",
    timeout: 15000,
  });
}

function tasks() {
  group("tasks");

  check("tasks.js self-check passes", () => {
    const out = execFileSync("node", [join(ROOT, "skills", "outputty", "tasks.test.js")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert(out.includes("passed"), out.trim());
    return out.trim();
  });

  const graphFile = join(mkdtempSync(join(tmpdir(), "outputty-tasks-")), "g.jsonl");
  const write = (rows) => writeFileSync(graphFile, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

  check("schedule derives layers from deps", () => {
    write([
      { id: "t1", title: "base", status: "open", deps: [], scope: ["a.ts"] },
      { id: "t2", title: "on t1", status: "open", deps: ["t1"], scope: ["b.ts"] },
      { id: "t3", title: "on t2", status: "open", deps: ["t2"], scope: ["c.ts"] },
    ]);
    const layers = JSON.parse(runTasks(["schedule", "--json"], graphFile));
    assert(layers.length === 3, `expected 3 layers, got ${layers.length}`);
    return layers.map((l) => l.map((t) => t.id).join("+")).join(" → ");
  });

  check("STACK INVARIANT: every layer N+1 depends on layer N", () => {
    // The property the PR stack rests on: a task lands in the EARLIEST layer its deps allow, so
    // consecutive layers are always genuinely dependent and a linear stack states a real relationship.
    write([
      { id: "t1", title: "base", status: "open", deps: [], scope: ["a.ts"] },
      { id: "t2", title: "on t1", status: "open", deps: ["t1"], scope: ["b.ts"] },
      { id: "t3", title: "on t2", status: "open", deps: ["t2"], scope: ["c.ts"] },
      { id: "t7", title: "spans L1+L3", status: "open", deps: ["t1", "t3"], scope: ["g.ts"] },
      { id: "t8", title: "only t1", status: "open", deps: ["t1"], scope: ["h.ts"] },
    ]);
    const layers = JSON.parse(runTasks(["schedule", "--json"], graphFile));
    const at = {};
    layers.forEach((l, i) => l.forEach((t) => (at[t.id] = i)));
    const broken = [];
    for (let n = 1; n < layers.length; n++) {
      const touchesPrev = layers[n].some((t) => t.deps.some((d) => at[d] === n - 1));
      if (!touchesPrev) broken.push(n + 1);
    }
    assert(
      broken.length === 0,
      `layer(s) ${broken.join(",")} do not depend on the layer below — a linear PR stack would state a false dependency`,
    );
    const t8Layer = at["t8"] + 1;
    assert(t8Layer === 2, `a task depending only on layer 1 should land at layer 2, landed at ${t8Layer}`);
    return `${layers.length} layers, each depends on the one below`;
  });

  check("schedule rejects a dependency cycle", () => {
    write([
      { id: "a", title: "a", status: "open", deps: ["b"], scope: ["a.ts"] },
      { id: "b", title: "b", status: "open", deps: ["a"], scope: ["b.ts"] },
    ]);
    let threw = false;
    try {
      runTasks(["schedule", "--json"], graphFile);
    } catch {
      threw = true;
    }
    assert(threw, "a cycle was accepted");
    return "fails loud";
  });

  check("tasks sharing a folder land in ONE layer", () => {
    // `scope` is a folder now, and a layer is built by one agent in sequence — so a shared scope is the
    // normal case. The old same-layer clash check forced these apart and would fragment every plan.
    write([
      { id: "a", title: "a", status: "open", deps: [], scope: ["src/core"] },
      { id: "b", title: "b", status: "open", deps: [], scope: ["src/core"] },
    ]);
    const layers = JSON.parse(runTasks(["schedule", "--json"], graphFile));
    assert(layers.length === 1, `two tasks in one folder were split across ${layers.length} layers`);
    assert(layers[0].length === 2, "both tasks should share the layer");
    return "shared folder ≠ a missing dep";
  });

  check("add + close round-trip", () => {
    write([{ id: "t1", title: "base", status: "open", deps: [], scope: ["a.ts"] }]);
    runTasks(["add", "t9", "discovered", "--deps", "t1", "--scope", "z.ts", "--from", "t1"], graphFile);
    runTasks(["close", "t1"], graphFile);
    const readyNow = JSON.parse(runTasks(["ready", "--json"], graphFile)).map((t) => t.id);
    assert(readyNow.includes("t9"), `t9 not ready after closing t1: ${JSON.stringify(readyNow)}`);
    const raw = readFileSync(graphFile, "utf8");
    assert(raw.includes('"discovered_from"'), "discovered_from not recorded");
    return "add → close → ready reflects the change";
  });
}

// ---------------------------------------------------------------------------
// Wiring: what hooks.json claims vs what is on disk
// ---------------------------------------------------------------------------
function wiring() {
  group("wiring");

  check("hooks.json parses and every registered script exists", () => {
    const cfg = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8"));
    const cmds = [];
    for (const groups of Object.values(cfg.hooks)) {
      for (const g of groups) for (const h of g.hooks) cmds.push(h.command);
    }
    const missing = cmds.filter((c) => {
      const m = c.match(/hooks\/([\w.-]+\.js)/);
      return !m || !existsSync(join(ROOT, "hooks", m[1]));
    });
    assert(missing.length === 0, `registered but absent: ${JSON.stringify(missing)}`);
    return `${cmds.length} registered across ${Object.keys(cfg.hooks).length} events`;
  });

  check("require-grill.js gates the task graph on the skill actually loading", () => {
    // The defect this catches is silent: a phase whose engine is prose runs without its engine and
    // nothing errors. So the gate itself gets a test — all four paths.
    const run = (payload) => {
      try {
        return execSync(`node ${join(ROOT, "hooks", "require-grill.js")}`, {
          input: JSON.stringify(payload),
          encoding: "utf8",
          cwd: ROOT,
        });
      } catch (e) {
        return e.stdout || "";
      }
    };
    const t = join(tmpdir(), `grill-probe-${process.pid}.jsonl`);
    const graph = { tool_input: { file_path: "/x/.claude/trails/f.tasks.jsonl" } };

    writeFileSync(t, '{"message":{"content":[{"type":"tool_use","name":"Skill","input":{"skill":"grill"}}]}}\n');
    assert(run({ ...graph, transcript_path: t }).trim() === "", "a session that loaded grill was blocked");

    writeFileSync(t, '{"message":{"content":[{"type":"text","text":"no grill here"}]}}\n');
    const denied = JSON.parse(run({ ...graph, transcript_path: t }));
    assert(
      denied.hookSpecificOutput.permissionDecision === "deny",
      "a task graph was accepted in a session that never loaded grill",
    );

    assert(
      run({ tool_input: { file_path: "/x/src/foo.ts" }, transcript_path: t }).trim() === "",
      "the gate fired on a file that is not a task graph",
    );
    return "blocks an ungrilled task graph, ignores everything else";
  });

  check("every hook file on disk is registered in hooks.json", () => {
    const cfg = readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8");
    const onDisk = execSync("ls hooks/*.js", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split("\n")
      .map((p) => p.replace("hooks/", ""));
    const orphans = onDisk.filter((f) => !cfg.includes(f));
    assert(orphans.length === 0, `on disk but never registered: ${JSON.stringify(orphans)}`);
    return `${onDisk.length} hooks, all wired`;
  });

  check("every plugin agent has the frontmatter Claude Code requires", () => {
    const files = execSync("ls agents/*.md", { cwd: ROOT, encoding: "utf8" }).trim().split("\n");
    const bad = [];
    for (const f of files) {
      const fm = readFileSync(join(ROOT, f), "utf8").split("---")[1] ?? "";
      if (!/^name:/m.test(fm) || !/^description:/m.test(fm)) bad.push(f);
    }
    assert(bad.length === 0, `missing name/description: ${JSON.stringify(bad)}`);
    return `${files.length} agents valid`;
  });

  check("shipped changes carry a version bump", () => {
    // The version in marketplace.json is the plugin CACHE KEY: `claude plugin update` is a no-op until
    // it changes. Shipping a hook or skill change without bumping means no user ever receives it — no
    // error, no warning, just silence. Three PRs once landed on main unbumped; this check exists so a
    // fourth cannot.
    let base;
    try {
      base = execSync("git merge-base HEAD origin/main", { cwd: ROOT, encoding: "utf8" }).trim();
    } catch {
      return "no origin/main to compare against — skipped";
    }
    const head = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    if (head === base) return "on main — nothing to compare";
    const changed = execSync(`git diff --name-only ${base}..HEAD`, { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    const shipped = changed.filter((f) => /^(hooks|skills|agents)\//.test(f));
    if (shipped.length === 0) return "no shipped surface touched — bump not required";
    const versionAt = (ref) =>
      JSON.parse(execSync(`git show ${ref}:.claude-plugin/marketplace.json`, { cwd: ROOT, encoding: "utf8" }))
        .plugins[0].version;
    const before = versionAt(base);
    const after = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "marketplace.json"), "utf8")).plugins[0].version;
    assert(
      before !== after,
      `${shipped.length} shipped file(s) changed but the version is still ${before} — ` +
        `\`plugin update\` would deliver nothing. Bump .claude-plugin/marketplace.json.`,
    );
    return `${before} → ${after} for ${shipped.length} shipped file(s)`;
  });

  check("skill listing cost stays inside its budget", () => {
    const dirs = execSync("ls -d skills/*/", { cwd: ROOT, encoding: "utf8" }).trim().split("\n");
    let chars = 0;
    for (const d of dirs) {
      const p = join(ROOT, d, "SKILL.md");
      if (!existsSync(p)) continue;
      const fm = readFileSync(p, "utf8").split("---")[1] ?? "";
      chars += fm
        .split("\n")
        .filter((l) => /^(name|description):/.test(l))
        .join("\n").length;
    }
    const tokens = Math.round(chars / 4);
    assert(tokens < 1000, `skill listing is ~${tokens} est. tokens — over the ~1% context budget`);
    return `${dirs.length} skills, ~${tokens} est. tokens resident`;
  });

  check("every review tag QA names is defined in the playbook, and vice versa", () => {
    // QA cites tags it does not define; the playbook defines tags nobody consumes. Either drift is
    // silent — QA emits a tag with no carve-outs behind it, or a definition rots unread.
    const tags = (text, re) => new Set(Array.from(text.matchAll(re), (m) => m[1]));
    const defined = tags(
      readFileSync(join(ROOT, "skills/audit/references/audit-playbook.md"), "utf8"),
      /^- `([a-z]+):`/gm,
    );
    const cited = tags(readFileSync(join(ROOT, "agents/outputty-qa.md"), "utf8"), /`([a-z]+):`/g);

    const undefined_ = [...cited].filter((t) => !defined.has(t));
    const unused = [...defined].filter((t) => !cited.has(t));
    assert(!undefined_.length, `outputty-qa cites undefined tag(s): ${undefined_.join(", ")}`);
    assert(!unused.length, `playbook defines tag(s) QA never cites: ${unused.join(", ")}`);
    return `${defined.size} tags, defined and cited in lockstep`;
  });
}

// ---------------------------------------------------------------------------
// Green gate
// ---------------------------------------------------------------------------
function gate() {
  group("gate");

  check("prettier: every tracked file is formatted", () => {
    const tracked = execSync("git ls-files '*.md' '*.js' '*.json'", { cwd: ROOT, encoding: "utf8" }).trim().split("\n");
    try {
      execFileSync("npx", ["prettier", "--check", ...tracked], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: "pipe",
        timeout: 120000,
      });
    } catch (e) {
      const warns = ((e.stdout || "") + (e.stderr || ""))
        .split("\n")
        .filter((l) => l.startsWith("[warn]") && !l.includes("Code style"));
      assert(warns.length === 0, `unformatted: ${warns.join(", ")}`);
    }
    return `${tracked.length} tracked files clean`;
  });

  check("oxlint: no errors", () => {
    execFileSync("npx", ["oxlint"], { cwd: ROOT, encoding: "utf8", stdio: "pipe", timeout: 120000 });
    return "clean";
  });
}

// ---------------------------------------------------------------------------
const suites = { hooks, tasks, wiring, gate };
const which = process.argv[2];
const toRun = which ? [which] : Object.keys(suites);
for (const s of toRun) {
  if (!suites[s]) {
    console.error(`unknown suite "${s}" — pick one of: ${Object.keys(suites).join(", ")}`);
    process.exit(2);
  }
  suites[s]();
}

let lastGroup = "";
for (const r of results) {
  if (r.group !== lastGroup) {
    console.log(`\n${r.group.toUpperCase()}`);
    lastGroup = r.group;
  }
  console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `\n        ${r.detail}` : ""}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed${failed ? ` — ${failed} FAILED` : ""}`);
process.exit(failed ? 1 : 0);
