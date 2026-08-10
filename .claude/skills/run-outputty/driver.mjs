#!/usr/bin/env node
// outputty driver — exercises the plugin's executable surface end to end.
//
// outputty has no GUI and no server. Its runnable surface is (a) the hook scripts that speak the
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
// tasks.js runs on bun (Bun.YAML) since the JSONL→YAML migration — node has no builtin YAML support,
// so invoking it any other way throws before it reads a single task.
const tasksJs = () => join(ROOT, "skills", "outputty", "tasks.js");

function runTasks(args, file) {
  return execFileSync("bun", [tasksJs(), ...args], {
    env: { ...process.env, OUTPUTTY_TASKS: file },
    cwd: ROOT,
    encoding: "utf8",
    timeout: 15000,
  });
}

function tasks() {
  group("tasks");

  check("tasks.js self-check passes", () => {
    const out = execFileSync("bun", [join(ROOT, "skills", "outputty", "tasks.test.js")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert(out.includes("passed"), out.trim());
    return out.trim();
  });

  // A valid YAML list, one flow-style record per item — real YAML (Bun.YAML.parse reads it fine),
  // not the bare newline-delimited JSON tasks.js used to accept. Written fresh per check via `write`;
  // a mutating command (`add`/`close`) then rewrites the whole file as block-style YAML through
  // `saveTasks`, which is what "add + close round-trip" below reads back.
  const graphFile = join(mkdtempSync(join(tmpdir(), "outputty-tasks-")), "g.tasks.yaml");
  const write = (rows) => writeFileSync(graphFile, rows.map((r) => `- ${JSON.stringify(r)}`).join("\n") + "\n");

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

  check("a layer branch resolves to its feature's graph, not a fresh empty one", () => {
    // BUILD publishes one branch per LAYER (feature/x-l1, -l2, ...) while the graph is one per feature.
    // Standing on a layer branch must resolve to the feature's real graph, not silently fork a new,
    // empty one at a path derived from the layer-suffixed branch name.
    const repo = mkdtempSync(join(tmpdir(), "outputty-layer-branch-"));
    execSync("git init -q -b feature/multi-l2", { cwd: repo });
    execSync("git -c user.email=t@t -c user.name=t commit -q --allow-empty -m x", { cwd: repo });
    mkdirSync(join(repo, ".claude", "trails"), { recursive: true });
    writeFileSync(
      join(repo, ".claude", "trails", "feature-multi.tasks.yaml"),
      "- id: t1\n  title: base\n  status: open\n  deps: []\n  scope: []\n",
    );
    try {
      const env = { ...process.env };
      delete env.OUTPUTTY_TASKS;
      const out = execFileSync("bun", [tasksJs(), "ready", "--json"], { cwd: repo, env, encoding: "utf8" });
      assert(
        JSON.parse(out).some((t) => t.id === "t1"),
        `layer branch did not find the feature graph: ${out}`,
      );

      // A near-miss (only an L1 sibling exists, no exact match) must fail loud, not fork empty.
      const repo2 = mkdtempSync(join(tmpdir(), "outputty-layer-branch2-"));
      execSync("git init -q -b feature/other-l2", { cwd: repo2 });
      execSync("git -c user.email=t@t -c user.name=t commit -q --allow-empty -m x", { cwd: repo2 });
      mkdirSync(join(repo2, ".claude", "trails"), { recursive: true });
      writeFileSync(
        join(repo2, ".claude", "trails", "feature-other-l1.tasks.yaml"),
        "- id: t1\n  title: base\n  status: open\n  deps: []\n  scope: []\n",
      );
      let threw = false;
      try {
        execFileSync("bun", [tasksJs(), "ready", "--json"], { cwd: repo2, env, encoding: "utf8" });
      } catch {
        threw = true;
      }
      assert(threw, "a near-miss sibling graph should fail loud instead of forking an empty graph");
      rmSync(repo2, { recursive: true, force: true });

      // A genuinely different feature whose slug happens to PREFIX an existing one's must not be
      // blocked — a bare `startsWith` match would wrongly treat "feature/yaml" as a near-miss of an
      // existing "feature-yaml-product-memory.tasks.yaml", refusing a brand-new feature its own graph.
      const repo3 = mkdtempSync(join(tmpdir(), "outputty-layer-branch3-"));
      execSync("git init -q -b feature/yaml", { cwd: repo3 });
      execSync("git -c user.email=t@t -c user.name=t commit -q --allow-empty -m x", { cwd: repo3 });
      mkdirSync(join(repo3, ".claude", "trails"), { recursive: true });
      writeFileSync(
        join(repo3, ".claude", "trails", "feature-yaml-product-memory.tasks.yaml"),
        "- id: t1\n  title: unrelated\n  status: open\n  deps: []\n  scope: []\n",
      );
      const outUnrelated = execFileSync("bun", [tasksJs(), "ready", "--json"], {
        cwd: repo3,
        env,
        encoding: "utf8",
      });
      assert(
        JSON.parse(outUnrelated).length === 0,
        `a brand-new feature was wrongly blocked by an unrelated prefix-sharing graph: ${outUnrelated}`,
      );
      rmSync(repo3, { recursive: true, force: true });
      return "layer branch finds the feature graph; a near-miss sibling fails loud; a prefix-sharing unrelated feature is not blocked";
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  check("add + close round-trip", () => {
    write([{ id: "t1", title: "base", status: "open", deps: [], scope: ["a.ts"] }]);
    runTasks(["add", "t9", "discovered", "--deps", "t1", "--scope", "z.ts", "--from", "t1"], graphFile);
    runTasks(["close", "t1"], graphFile);
    const readyNow = JSON.parse(runTasks(["ready", "--json"], graphFile)).map((t) => t.id);
    assert(readyNow.includes("t9"), `t9 not ready after closing t1: ${JSON.stringify(readyNow)}`);
    // `add` rewrites the file through `saveTasks` — block-style YAML, so the key appears unquoted
    // (`discovered_from: t1`), not as the quoted JSON key the pre-migration fixture used.
    const raw = readFileSync(graphFile, "utf8");
    assert(raw.includes("discovered_from"), "discovered_from not recorded");
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

  check("every hook is invoked through node, not as a bare executable path", () => {
    // A bare "${CLAUDE_PLUGIN_ROOT}/hooks/x.js" needs the executable bit. Git stores these 100644 and
    // the plugin cache copies them 0644, so /bin/sh answers "Permission denied" — a NON-BLOCKING
    // error, so the tool call proceeds and the gate is silently dead. require-grill.js shipped that
    // way and never fired once. The other checks all run `node <path>` directly, which is why they
    // passed throughout: they exercise the script, never the registration.
    const cfg = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8"));
    const bare = [];
    for (const groups of Object.values(cfg.hooks)) {
      for (const g of groups) {
        for (const h of g.hooks) {
          if (h.type === "command" && !/^node\s/.test(h.command)) bare.push(h.command);
        }
      }
    }
    assert(!bare.length, `invoked as a bare path — prefix with \`node\`:\n  ${bare.join("\n  ")}`);
    return `${
      Object.values(cfg.hooks)
        .flat()
        .flatMap((g) => g.hooks).length
    } hooks, all invoked via node`;
  });

  check("every gate is registered for the tools it must actually intercept", () => {
    // The checks below pipe payloads straight at each hook script, which proves the LOGIC and says
    // nothing about whether the tool ever reaches it. Narrowing a matcher is therefore invisible: the
    // grill gate kept passing its own test while `Write|Edit` let a Bash-written task graph through —
    // measured live on 0.29.0. The wiring is the other half of the gate.
    const cfg = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8"));
    const matchersFor = (script) =>
      (cfg.hooks.PreToolUse || [])
        .filter((g) => g.hooks.some((h) => h.command.includes(script)))
        .flatMap((g) => (g.matcher || "").split("|"));

    const required = {
      "require-grill.js": ["Write", "Edit", "Bash"],
      "require-master-qa.js": ["Bash"],
      "inject-code-rules.js": ["Edit", "Write", "NotebookEdit"],
    };
    for (const [script, tools] of Object.entries(required)) {
      const wired = matchersFor(script);
      const gaps = tools.filter((t) => !wired.includes(t));
      assert(!gaps.length, `${script} never sees ${gaps.join(", ")} — its matcher is ${JSON.stringify(wired)}`);
    }
    return `${Object.keys(required).length} gates wired to every tool they gate`;
  });

  check("inject-code-rules.js fires on the first edit and only the first", () => {
    const run = (transcript) =>
      execSync(`node ${join(ROOT, "hooks", "inject-code-rules.js")}`, {
        input: JSON.stringify({ tool_input: { file_path: "/x/src/a.ts" }, transcript_path: transcript }),
        encoding: "utf8",
        cwd: ROOT,
      });
    const t = join(tmpdir(), `code-rules-${process.pid}.jsonl`);

    writeFileSync(t, '{"message":{"content":[{"type":"text","text":"no rules yet"}]}}\n');
    const first = JSON.parse(run(t));
    const ctx = first.hookSpecificOutput.additionalContext;
    assert(ctx.includes("laziest working diff"), "first edit did not receive the code rules");
    assert(ctx.length < 10_000, `additionalContext is ${ctx.length} chars — over the 10k cap`);

    // Once the rules are in the transcript (the sentinel), every later edit stays silent.
    writeFileSync(t, `{"message":{"content":[{"type":"text","text":"outputty:code-rules already here"}]}}\n`);
    assert(run(t).trim() === "", "the rules were re-injected into a transcript that already has them");

    // Subagents preload the same rules via their charter's `skills:` field — the hook must not
    // double-deliver to them.
    writeFileSync(t, '{"message":{"content":[{"type":"text","text":"fresh"}]}}\n');
    const sub = execSync(`node ${join(ROOT, "hooks", "inject-code-rules.js")}`, {
      input: JSON.stringify({
        agent_id: "a1",
        agent_type: "outputty:outputty-builder",
        tool_input: { file_path: "/x/src/a.ts" },
        transcript_path: t,
      }),
      encoding: "utf8",
      cwd: ROOT,
    });
    assert(sub.trim() === "", "the hook injected into a subagent that already preloads the rules");
    return "first main-session edit injects; later edits and subagents stay silent";
  });

  check("the always-loaded and injected docs stay inside their budgets", () => {
    // Every word of protocol.md rides every session; the other two ride every subagent spawn / first
    // edit. Budgets keep the re-bloat this file was measured accreting (2,030 words before the 0.35.0
    // rewrite) from returning one paragraph at a time.
    const budgets = {
      "hooks/protocol.md": 1_300,
      "skills/agent-protocol/SKILL.md": 450,
      "skills/code-rules/SKILL.md": 600,
    };
    const sizes = [];
    for (const [file, budget] of Object.entries(budgets)) {
      const words = readFileSync(join(ROOT, file), "utf8").split(/\s+/).filter(Boolean).length;
      assert(words <= budget, `${file} is ${words} words — budget is ${budget}. Cut, don't raise the budget.`);
      sizes.push(`${file.split("/")[1]} ${words}/${budget}`);
    }
    return sizes.join(" · ");
  });

  check("every charter preloads agent-protocol, and every preload resolves to a real skill", () => {
    // The shared rules moved from a SubagentStart hook to `skills:` preloads (0.36.0), so delivery now
    // depends on every charter carrying the field and every named skill existing. Either half missing
    // is silent: the agent simply spawns without its rules.
    const charters = execSync("git ls-files 'agents/*.md'", { cwd: ROOT, encoding: "utf8" }).trim().split("\n");
    const problems = [];
    for (const f of charters) {
      const fm = readFileSync(join(ROOT, f), "utf8").split("---")[1] ?? "";
      const m = fm.match(/^skills:\s*\[([^\]]*)\]/m);
      if (!m) {
        problems.push(`${f}: no skills: preload`);
        continue;
      }
      const names = m[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (!names.includes("agent-protocol")) problems.push(`${f}: does not preload agent-protocol`);
      for (const n of names) {
        if (!existsSync(join(ROOT, "skills", n, "SKILL.md"))) problems.push(`${f}: preloads missing skill '${n}'`);
      }
    }
    assert(!problems.length, `preload gaps:\n  ${problems.join("\n  ")}`);
    return `${charters.length} charters, all preloading agent-protocol via real skills`;
  });

  check("shipped docs state things — history lives in lessons.yaml and claims/", () => {
    // A doc that narrates its own past ("this file used to say…", "measured on a real project…")
    // bills every reader for a story whose home is lessons.yaml, and evidence whose home is a claim
    // file. Grep-able tells, so grep them.
    const tells = [
      /used to (say|hold|live|ride|be a real)/,
      /predates the/,
      /[Mm]easured (on a real|on a live|across \d+ days|live —)/,
    ];
    const files = execSync("git ls-files 'skills/*.md' 'agents/*.md' 'hooks/*.md'", {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n");
    const hits = [];
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const re of tells) if (re.test(text)) hits.push(`${f}: "${text.match(re)[0]}"`);
    }
    assert(!hits.length, `history embedded in shipped docs (state it; move the story):\n  ${hits.join("\n  ")}`);
    return `${files.length} shipped docs, history-free`;
  });

  check("every claim file carries the canonical shape", () => {
    // A claim is only revisitable if it says how it was validated and how to revalidate. A claim
    // missing either is an assertion wearing a filename.
    const dir = join(ROOT, ".claude", "claims");
    if (!existsSync(dir)) return "no claims folder yet — first cycle";
    const files = execSync(`ls ${dir}`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    const bad = [];
    for (const f of files) {
      const text = readFileSync(join(dir, f), "utf8");
      // A converted claim is `.claude/claims/<slug>.yaml` (product-template.md's `claims` shape):
      // `{ statement, status, validated, scope, evidence, revalidate }`. Same revisitability bar, YAML fields.
      const parts =
        f.endsWith(".yaml") || f.endsWith(".yml")
          ? ["statement", "status", "validated", "scope", "evidence", "revalidate"]
          : ["**Status:**", "**Validated:**", "## Statement", "## How it was validated", "## How to revalidate"];
      for (const part of parts) {
        if (!text.includes(part)) bad.push(`${f}: missing ${part}`);
      }
    }
    assert(!bad.length, `malformed claim(s):\n  ${bad.join("\n  ")}`);
    return `${files.length} claims, all revisitable`;
  });

  check("the delivery docs obey ASD-STE100's sentence limit", () => {
    // Dogfooding: the plugin states the standard, so the docs that carry it to every session and every
    // agent must pass it. These three are held at zero because they are the ones nobody opts out of.
    // The rest of the corpus is measured, not gated — a per-file ratchet is the follow-up.
    const strict = ["hooks/protocol.md", "skills/agent-protocol/SKILL.md", "skills/code-rules/SKILL.md"];
    const units = (text) => {
      const t = text.replace(/```[\s\S]*?```/g, "\n\n");
      const out = [];
      let buf = [];
      const flush = () => {
        if (buf.length) out.push(buf.join(" ").trim());
        buf = [];
      };
      for (const raw of t.split("\n")) {
        const l = raw.trim();
        if (!l || l.startsWith("#") || l.startsWith("|") || /^[-=]{3,}$/.test(l)) {
          flush();
          continue;
        }
        if (/^([-*+]|\d+\.)\s/.test(l)) {
          flush();
          buf.push(l.replace(/^([-*+]|\d+\.)\s/, ""));
          continue;
        }
        buf.push(l);
      }
      flush();
      return out;
    };
    const wc = (x) =>
      x
        .replace(/[`*_>#[\]()]/g, "")
        .split(/\s+/)
        .filter(Boolean).length;
    const over = [];
    for (const f of strict) {
      for (const u of units(readFileSync(join(ROOT, f), "utf8"))) {
        for (const sent of u.split(/(?<=[.!?:])\s+(?=[A-Z*`("“])/)) {
          if (wc(sent) > 25) over.push(`${f} (${wc(sent)}w): ${sent.trim().slice(0, 90)}…`);
        }
      }
    }
    assert(!over.length, `sentences over 25 words — split them:\n  ${over.join("\n  ")}`);
    return `${strict.length} delivery docs, every sentence within the limit`;
  });

  check("the response format is reachable and the example library is not empty", () => {
    // The reuse rule failed once because it read "drawn from examples.md WHEN ONE FITS" and the
    // library held two examples — so nothing ever fit and the escape hatch made it a no-op. Both
    // halves are now checked: the pointer resolves, and the library is stocked enough to reuse from.
    const ref = join(ROOT, "skills/outputty/references/response-format.md");
    assert(existsSync(ref), "response-format.md is missing — the shape has no home");
    const text = readFileSync(ref, "utf8");
    for (const needle of ["restated high", "one-line", "examples.yaml"]) {
      assert(text.includes(needle) || text.includes(needle.replace("-", " ")), `response-format.md lost: ${needle}`);
    }
    assert(
      !/when one fits/i.test(readFileSync(join(ROOT, "hooks/protocol.md"), "utf8")),
      'protocol.md still says "when one fits" — that escape hatch is what made the reuse rule a no-op',
    );
    const ex = join(ROOT, ".claude", "examples.yaml");
    if (!existsSync(ex)) return "no example library in this repo";
    const n = (readFileSync(ex, "utf8").match(/^- name:/gm) || []).length;
    assert(n >= 3, `examples.yaml holds ${n} examples — too thin to reuse from, so responses invent their own`);
    return `response-format reachable; ${n} canonical examples available`;
  });

  check("the communication principles ride every delivery doc", () => {
    // MECE grouping, example-led returns, and highest-level-first are delivered mechanically —
    // protocol.md to the main session, agent-protocol to every charter. A future trim that drops one
    // silently reverts the behaviour, so the delivery docs are pinned to carry all three.
    const must = {
      "hooks/protocol.md": ["MECE", "highest level", "⚠", "ASD-STE100", "response-format.md"],
      "skills/agent-protocol/SKILL.md": ["MECE", "highest level", "⚠", "ASD-STE100"],
      "skills/grill/SKILL.md": ["❓", "➡️", "AskUserQuestion"],
    };
    for (const [file, needles] of Object.entries(must)) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const missing = needles.filter((n) => !text.includes(n));
      assert(!missing.length, `${file} lost: ${missing.join(", ")}`);
    }
    return "MECE + example-led + altitude pinned in both delivery docs";
  });

  check("the product-doc split is named consistently by producer and consumers", () => {
    // Product memory is a set of record sets, queried by role. The load rule lives in protocol.md and
    // the shape in product-template.md; a consumer still pointing a section at the OLD monolith home
    // ("product.yaml's Architecture") silently reads a section that no longer exists there. Grep-able
    // drift, so grep it.
    const docs = ["product.yaml", "roadmap.yaml", "architecture.yaml", "lessons.yaml", "claims/", "examples.yaml"];
    for (const file of ["hooks/protocol.md", "skills/outputty/references/product-template.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const missing = docs.filter((d) => !text.includes(d));
      assert(!missing.length, `${file} does not name: ${missing.join(", ")}`);
    }
    const stale = [];
    const forbidden = [
      /product\.(md|yaml)['’`]?s (Architecture|Status & roadmap|roadmap|target program)/i,
      /Status & roadmap[^.\n]{0,40}in `?product\.(md|yaml)/i,
    ];
    const files = execSync("git ls-files 'skills/*.md' 'agents/*.md' 'hooks/*.md' 'hooks/*.js'", {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n");
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const re of forbidden) if (re.test(text)) stale.push(`${f}: ${text.match(re)[0]}`);
    }
    assert(!stale.length, `section still pointed at the monolith:\n  ${stale.join("\n  ")}`);
    return `6 record sets named by producer+template; ${files.length} shipped files free of monolith refs`;
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
    const graph = { tool_input: { file_path: "/x/.claude/trails/f.tasks.yaml" } };

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

  check("require-grill.js accepts a resumed cycle whose trail already holds decisions", () => {
    // SPEC Monday, PLAN Tuesday is an ordinary long-cycle shape. Reading only the current transcript
    // denies a properly grilled spec and demands the work be thrown away and redone.
    const dir = join(tmpdir(), `grill-resume-${process.pid}`, ".claude", "trails");
    mkdirSync(dir, { recursive: true });
    const t = join(tmpdir(), `grill-resume-${process.pid}.jsonl`);
    writeFileSync(t, '{"message":{"content":[{"type":"text","text":"fresh session, no grill"}]}}\n');

    const run = (name, via = "file_path") => {
      const path = join(dir, `${name}.tasks.yaml`);
      const payload = {
        tool_input: via === "file_path" ? { file_path: path } : { command: `node gen-tasks.mjs ${path}` },
        transcript_path: t,
      };
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

    writeFileSync(
      join(dir, "settled.trail.yaml"),
      'core_objective: |\n  x\ndecisions:\n  - question: "The seam"\n    answer: locked.\n    link: product.md\n',
    );
    const allowed = JSON.parse(run("settled"));
    assert(
      !allowed.hookSpecificOutput.permissionDecision,
      "a resumed cycle with a populated trail was denied — that throws away a real grilling",
    );

    writeFileSync(
      join(dir, "empty.trail.yaml"),
      "core_objective: |\n  x\ndecisions: []\nnot_yet_specified:\n  - something\n",
    );
    const denied = JSON.parse(run("empty"));
    assert(
      denied.hookSpecificOutput.permissionDecision === "deny",
      "an empty decisions section counted as evidence of grilling",
    );
    // The combination: a resumed cycle whose graph is written by a Bash-run generator. Both halves are
    // covered above, but the trail lookup has to recover the path from a command string rather than a
    // `file_path` field, and that extraction is the part that can silently miss.
    const viaBash = JSON.parse(run("settled", "command"));
    assert(
      !viaBash.hookSpecificOutput.permissionDecision,
      "a resumed cycle writing the graph via Bash was denied — the trail path was not recovered from the command",
    );
    const bashDenied = JSON.parse(run("empty", "command"));
    assert(
      bashDenied.hookSpecificOutput.permissionDecision === "deny",
      "a Bash-written graph with an empty trail was allowed",
    );

    return "resumed cycle passes on trail evidence via Write or Bash; an empty trail still denies";
  });

  check("require-grill.js gates the task-graph FILE, not just the Write tool", () => {
    // Measured live on 0.29.0: a PLAN wrote a scratchpad generator and ran it via Bash, so a
    // Write|Edit-only gate never fired and a builder was dispatched off an ungrilled graph.
    const run = (toolInput, transcript) => {
      try {
        return execSync(`node ${join(ROOT, "hooks", "require-grill.js")}`, {
          input: JSON.stringify({ tool_input: toolInput, transcript_path: transcript }),
          encoding: "utf8",
          cwd: ROOT,
        });
      } catch (e) {
        return e.stdout || "";
      }
    };
    const t = join(tmpdir(), `grill-bash-${process.pid}.jsonl`);
    writeFileSync(t, '{"message":{"content":[{"type":"text","text":"no grill"}]}}\n');

    const viaBash = JSON.parse(run({ command: "node /tmp/gen-tasks.mjs .claude/trails/feat.tasks.yaml" }, t));
    assert(
      viaBash.hookSpecificOutput.permissionDecision === "deny",
      "a task graph written through a Bash-run script slipped past the gate — the live 0.29.0 bypass",
    );

    assert(run({ command: "npm test && git status" }, t).trim() === "", "the gate fired on an ordinary Bash command");
    assert(
      run({ command: "cat .claude/trails/feat.trail.yaml" }, t).trim() === "",
      "the gate fired on the trail rather than the task graph",
    );
    return "denies the graph via Write, Edit or Bash; ignores everything else";
  });

  check("require-master-qa.js gates the merge on the build's one real run", () => {
    const run = (command, transcript) => {
      try {
        return execSync(`node ${join(ROOT, "hooks", "require-master-qa.js")}`, {
          input: JSON.stringify({ tool_input: { command }, transcript_path: transcript }),
          encoding: "utf8",
          cwd: ROOT,
        });
      } catch (e) {
        return e.stdout || "";
      }
    };
    const t = join(tmpdir(), `mqa-probe-${process.pid}.jsonl`);

    writeFileSync(t, '{"message":{"content":[{"type":"text","text":"nothing ran"}]}}\n');
    for (const cmd of ["gh pr merge 12 --merge", "gh stack merge 12 --yes --merge"]) {
      const denied = JSON.parse(run(cmd, t));
      assert(
        denied.hookSpecificOutput.permissionDecision === "deny",
        `\`${cmd}\` was allowed in a session that never ran master QA`,
      );
    }

    writeFileSync(t, '{"input":{"subagent_type":"outputty:outputty-master-qa"}}\n');
    assert(
      run("gh stack merge 12 --yes --merge", t).trim() === "",
      "a session that ran master QA was blocked from merging",
    );
    assert(run("git status", t).trim() === "", "the gate fired on a command that is not a merge");
    return "blocks an unrun build from merging, ignores everything else";
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

  check("every ${CLAUDE_PLUGIN_ROOT} pointer resolves to a file on disk", () => {
    const files = execSync("git ls-files '*.md'", { cwd: ROOT, encoding: "utf8" }).trim().split("\n");
    const broken = [];
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const [, p] of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+)/g)) {
        if (!existsSync(join(ROOT, p))) broken.push(`${f} -> ${p}`);
      }
    }
    assert(!broken.length, `pointer(s) to nothing:\n  ${broken.join("\n  ")}`);
    return `${files.length} markdown files, every plugin-root pointer lands`;
  });

  check("each reviewer's git range matches what it actually reviews", () => {
    // QA runs BEFORE the commit stage, so the builder's work is the uncommitted working tree: a
    // `...HEAD` range returns empty and reads exactly like "nothing to review". Master QA runs after
    // every layer was committed, so a range diff is the complete and correct view. Getting these
    // backwards is silent in both directions, which is why it is a check and not a comment.
    const qa = readFileSync(join(ROOT, "agents/outputty-qa.md"), "utf8");
    const master = readFileSync(join(ROOT, "agents/outputty-master-qa.md"), "utf8");
    assert(
      !/git diff[^\n`]*\.\.\.HEAD/.test(qa),
      "outputty-qa uses a committed-range diff, but it reviews the uncommitted working tree",
    );
    assert(
      /--porcelain -uall/.test(qa),
      "outputty-qa must list files with `git status --porcelain -uall` — plain `git diff` cannot see new files",
    );
    assert(
      /git diff[^\n`]*\.\.\.HEAD/.test(master),
      "outputty-master-qa reviews committed history and must use a `<base>...HEAD` range",
    );
    return "qa: working tree, master-qa: committed range";
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
