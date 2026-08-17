#!/usr/bin/env node
// outputty driver — exercises the plugin's executable surface end to end.
//
// outputty has no GUI and no server. Its runnable surface is the tasks.js graph engine that BUILD
// drains, plus the docs.js query engine. Both are pure processes, so the "app" is driven by feeding
// them realistic inputs and asserting on what comes back — which is exactly what this does. The
// remaining suites gate the delivery docs and skills the plugin ships as its instruction surface.
//
//   node .claude/skills/run-outputty/driver.mjs            # everything
//   node .claude/skills/run-outputty/driver.mjs tasks      # graph engine only
//   node .claude/skills/run-outputty/driver.mjs wiring     # skills/docs ↔ disk agreement
//   node .claude/skills/run-outputty/driver.mjs gate       # prettier + oxlint
//
// Exit 0 = every check passed. Exit 1 = at least one failed; each failure prints what it expected.
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from "node:fs";
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
 * Tracked files that are also present on disk.
 *
 * `git ls-files` lists what the INDEX holds, so it still names a file deleted in the working tree until
 * the deletion is staged. Every check below reads what it lists, so an unstaged deletion would crash the
 * check rather than report on the files that remain.
 * @param {string} patterns - pathspecs, already quoted for the shell.
 * @returns {string[]} repo-relative paths that exist.
 */
const lsFiles = (patterns) =>
  execSync(`git ls-files ${patterns}`, { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((f) => existsSync(join(ROOT, f)));

// A SKILL.md opens with a YAML `---` frontmatter block (name + description). That is metadata Claude
// reads to pick a skill, not delivery prose, and its context cost is the skill-listing budget's concern
// — so the body budget and the ASD-STE100 sentence limit both measure the body, with frontmatter cut.
const stripFrontmatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, "");

// ---------------------------------------------------------------------------
// Task graph engine
// ---------------------------------------------------------------------------
// tasks.js runs on bun (Bun.YAML) since the JSONL→YAML migration — node has no builtin YAML support,
// so invoking it any other way throws before it reads a single task.
const tasksJs = () => join(ROOT, "skills", "outputty", "tasks.js");

// A throwaway product-memory directory: `<home>/trails/g.trail.yaml` holds the graph structure,
// `<home>/tasks/<id>.yaml` holds each task's state, `<home>/tasks.yaml` is the derived index.
// `OUTPUTTY_TASKS` names the trail, `OUTPUTTY_HOME` moves the rest of the set beside it.
const fixtureHome = mkdtempSync(join(tmpdir(), "outputty-tasks-"));
const graphFile = join(fixtureHome, "trails", "g.trail.yaml");
const stateDir = join(fixtureHome, "tasks");

// The smallest real trail: a hand-authored destination plus a one-task `tasks:` section.
const TRAIL_FIXTURE = "core_objective: |\n  A fixture trail.\n\ntasks:\n  - id: t1\n    title: base\n    deps: []\n";

function runTasks(args, file = graphFile) {
  return execFileSync("bun", [tasksJs(), ...args], {
    env: { ...process.env, OUTPUTTY_TASKS: file, OUTPUTTY_HOME: fixtureHome },
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

  // docs.js is an executable surface like tasks.js, so its suite belongs in the same gate. It was
  // absent until master QA proved the gap by deleting product.yaml AND architecture.yaml and still
  // getting 48/48 — a new executable joined the plugin and no layer owned wiring it in.
  // A plugin is installed elsewhere and run against the user's repo, so a bare `bun skills/...` path
  // resolves only in this checkout. Master QA proved the gap: every shipped instruction named docs.js
  // bare, so the tool worked here and nowhere else — invisible to nine layers, per-layer QA, a salvage
  // pass and 50 checks, because they all ran here. The existing pointer check is blind to it: it
  // validates that ${CLAUDE_PLUGIN_ROOT} pointers RESOLVE, never that one is USED.
  check("every plugin executable is invoked through ${CLAUDE_PLUGIN_ROOT}", () => {
    const files = lsFiles("'agents/*.md' 'skills/**/*.md' 'README.md'");
    const bare = [];
    for (const f of files) {
      for (const line of readFileSync(join(ROOT, f), "utf8").split("\n")) {
        // Capture the path, then require it to be rooted — do not try to spot the bad forms.
        // The first version of this check used a negative lookahead for the rooted prefix and was
        // blind to `bun "/skills/x.js"`, a half-rooted form a shell expansion produced in 10 places
        // while the check reported "every bun invocation rooted". Match the path, judge the path.
        for (const m of line.matchAll(/bun\s+"?([^\s"`']*\.js)/g)) {
          if (!m[1].startsWith("${CLAUDE_PLUGIN_ROOT}/")) bare.push(`${f}: ${m[0]}`);
        }
      }
    }
    assert(
      !bare.length,
      `not rooted at \${CLAUDE_PLUGIN_ROOT} — breaks in every consumer repo:\n  ${bare.join("\n  ")}`,
    );
    return `${files.length} instruction files, every bun invocation rooted`;
  });

  // Syntax gating is not schema gating. Renaming a section that an instruction names by string leaves
  // every file parseable and every suite green while the documented command dies. Proven by mutation:
  // `north_star` -> `northStar` kept the driver at 50/50 while protocol.md's first instructed query
  // broke. So run the documented commands themselves.
  check("every docs.js query named in a shipped instruction still answers", () => {
    const files = lsFiles("'agents/*.md' 'skills/**/*.md'");
    const invocations = new Set();
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const m of text.matchAll(/docs\.js"?\s+([a-z_]+)\s+--section\s+([a-z_]+)/g)) {
        // Skip placeholders the caller substitutes; only concrete pairs are assertable.
        if (!m[1].includes("<") && !m[2].includes("<")) invocations.add(`${m[1]} --section ${m[2]}`);
      }
    }
    assert(invocations.size >= 3, `expected concrete documented queries, found ${invocations.size}`);
    const dead = [];
    for (const inv of invocations) {
      const [set, , section] = inv.split(" ");
      try {
        execFileSync("bun", [join(ROOT, "skills", "outputty", "docs.js"), set, "--section", section], {
          cwd: ROOT,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (err) {
        dead.push(
          `${inv}: ${
            String(err.stderr || err.message)
              .trim()
              .split("\n")[0]
          }`,
        );
      }
    }
    assert(!dead.length, `a documented query no longer answers:\n  ${dead.join("\n  ")}`);
    return `${invocations.size} documented queries all answer`;
  });

  check("docs.js self-check passes", () => {
    const out = execFileSync("bun", [join(ROOT, "skills", "outputty", "docs.test.js")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert(out.includes("passed"), out.trim());
    return out.trim();
  });

  // Markdown could not fail to parse; YAML can. The migration introduced a failure class the gate
  // never covered — a corrupted lessons.yaml passed every wiring check while docs.js reported a
  // parse error. Every committed product-memory file must load.
  check("every committed product-memory YAML parses", () => {
    const files = lsFiles("'.claude/*.yaml' '.claude/**/*.yaml'");
    assert(files.length >= 6, `expected the product-doc set, found ${files.length}`);
    // This driver runs on node, which has no YAML parser, so the parse itself goes to bun — the same
    // way the suites above do. Bun.YAML is the parser docs.js uses, so this gates the real reader.
    const probe = `
      const fs = require("fs");
      const broken = [];
      for (const f of process.argv.slice(1)) {
        try { Bun.YAML.parse(fs.readFileSync(f, "utf8")); }
        catch (err) { broken.push(f + ": " + err.message); }
      }
      console.log(broken.length ? "BROKEN\\n" + broken.join("\\n") : "OK");
    `;
    const out = execFileSync("bun", ["-e", probe, ...files], { cwd: ROOT, encoding: "utf8" }).trim();
    assert(out === "OK", `YAML no longer parses:\n  ${out}`);
    return `${files.length} YAML files parse`;
  });

  // The graph structure is the trail's `tasks:` section, hand-authored beside hand-authored `|` block
  // scalars. `write` rebuilds that trail and clears the state directory, so each check starts clean.
  const write = (rows) => {
    rmSync(stateDir, { recursive: true, force: true });
    mkdirSync(join(fixtureHome, "trails"), { recursive: true });
    writeFileSync(
      graphFile,
      "core_objective: |\n  A fixture trail, with a block scalar to protect.\n\ntasks:\n" +
        rows.map((r) => `  - ${JSON.stringify(r)}`).join("\n") +
        "\n",
    );
  };

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
    writeFileSync(join(repo, ".claude", "trails", "feature-multi.trail.yaml"), TRAIL_FIXTURE);
    try {
      const env = { ...process.env };
      delete env.OUTPUTTY_TASKS;
      delete env.OUTPUTTY_HOME;
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
      writeFileSync(join(repo2, ".claude", "trails", "feature-other-l1.trail.yaml"), TRAIL_FIXTURE);
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
      // existing "feature-yaml-product-memory.trail.yaml", refusing a brand-new feature its own graph.
      const repo3 = mkdtempSync(join(tmpdir(), "outputty-layer-branch3-"));
      execSync("git init -q -b feature/yaml", { cwd: repo3 });
      execSync("git -c user.email=t@t -c user.name=t commit -q --allow-empty -m x", { cwd: repo3 });
      mkdirSync(join(repo3, ".claude", "trails"), { recursive: true });
      writeFileSync(join(repo3, ".claude", "trails", "feature-yaml-product-memory.trail.yaml"), TRAIL_FIXTURE);
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
    runTasks(["add", "t9", "discovered", "--deps", "t1", "--scope", "z.ts", "--from", "t1"]);
    runTasks(["close", "t1"]);
    const readyNow = JSON.parse(runTasks(["ready", "--json"])).map((t) => t.id);
    assert(readyNow.includes("t9"), `t9 not ready after closing t1: ${JSON.stringify(readyNow)}`);
    // Both writes land in the per-task state files, one file each, so two sessions never collide.
    assert(
      readdirSync(stateDir).sort().join(",") === "t1.yaml,t9.yaml",
      `expected one state file per touched task, got ${JSON.stringify(readdirSync(stateDir))}`,
    );
    assert(readFileSync(join(stateDir, "t9.yaml"), "utf8").includes("discovered_from"), "discovered_from lost");
    return "add → close → ready reflects the change, one file per task";
  });

  check("TRAIL INVARIANT: a close leaves the trail byte for byte identical", () => {
    // `Bun.YAML.stringify` flattens every `|` block scalar into an escaped one-liner, and a mutating
    // command rewrites its whole file. A tool that wrote the trail would therefore destroy the
    // hand-authored prose in `core_objective` and in every `decisions` answer. So it writes state only.
    write([
      { id: "t1", title: "base", status: "open", deps: [], scope: ["a.ts"] },
      { id: "t2", title: "next", status: "open", deps: ["t1"], scope: ["b.ts"] },
    ]);
    const before = readFileSync(graphFile);
    runTasks(["close", "t1"]);
    runTasks(["amend", "t2", "--scope", "c.ts"]);
    runTasks(["add", "t9", "discovered", "--from", "t1"]);
    const after = readFileSync(graphFile);
    assert(before.equals(after), "a mutating command rewrote the trail — hand-authored prose would be lost");
    assert(readFileSync(graphFile, "utf8").includes("core_objective: |"), "the block scalar survives");
    const t2 = JSON.parse(runTasks(["schedule", "--json"]))
      .flat()
      .find((t) => t.id === "t2");
    assert(JSON.stringify(t2.scope) === '["b.ts","c.ts"]', `amend did not widen scope: ${JSON.stringify(t2.scope)}`);
    return "close + amend + add wrote 3 state files and 0 trail bytes";
  });

  check("index regenerates .claude/tasks.yaml from the trail plus the state files", () => {
    write([
      { id: "t1", title: "base", status: "open", deps: [], scope: ["a.ts"] },
      { id: "t2", title: "next", status: "open", deps: ["t1"], scope: ["b.ts"] },
    ]);
    runTasks(["close", "t1"]);
    const indexFile = join(fixtureHome, "tasks.yaml");
    writeFileSync(indexFile, "- id: hand-edited\n");
    const records = JSON.parse(runTasks(["index", "--json"]));
    assert(
      JSON.stringify(records.map((r) => [r.id, r.status])) === '[["t1","done"],["t2","open"]]',
      `index does not reflect the state files: ${JSON.stringify(records)}`,
    );
    const raw = readFileSync(indexFile, "utf8");
    assert(raw.startsWith("# DERIVED"), "the index does not say it is derived");
    assert(!raw.includes("hand-edited"), "a hand edit survived the regeneration — the index is derived");
    return `${records.length} records, regenerated from scratch`;
  });
}

// ---------------------------------------------------------------------------
// Wiring: what the shipped instructions claim vs what is on disk
// ---------------------------------------------------------------------------
function wiring() {
  group("wiring");

  check("the always-loaded and injected docs stay inside their budgets", () => {
    // Every word here rides a session. Budgets stop the re-bloat this corpus was measured accreting
    // (2,030 words before the 0.35.0 rewrite) from returning one paragraph at a time.
    //
    // TABLE ROWS ARE EXEMPT, and that is deliberate. shared.md's docs.js catalogue is 542 words of
    // table and it is the highest-value text the plugin ships: it converted prose into 3,358 measured
    // `docs.js` invocations. A total-word budget taxes adding a useful command at the same rate as
    // adding a paragraph of advice, so the cap is on PROSE, which is where bloat actually happens.
    const budgets = {
      // The CLAUDE.md managed block /outputty:init writes into every consumer repo — the sole always-on
      // surface, loaded by every session. 1_100 -> 1_550 at 0.54.0: ABSORPTION, not bloat. This was
      // hooks/shared.md (1,073 words, injected) plus the orchestrator charter rewritten in from the
      // deleted hooks/orchestrator.md (~460 words); the old per-session injection was this PLUS a
      // 2,000-word stage file, now on-demand skills. Ratchet down when a cut lands.
      // 1_550 -> 2_000 at 0.61.0: absorbed the machine-local orchestration harness — the briefing
      // discipline, the queue-driving rules, and read-the-whole-roadmap — merged in from the user's global
      // CLAUDE.md so the plugin owns them. Ratchet back down when the writing standard moves to the output style.
      "skills/init/block.md": 2_000,
      // The two stage flows, now shipped as skills the orchestrator invokes (was hooks/stage-*.md,
      // injected). Frontmatter is stripped before counting — it is metadata the skill-listing budget
      // already caps, not body prose. Budget is on the body a session loads when it invokes the stage.
      // Ratchet down when a cut lands; raise only with a receipt naming what was absorbed.
      "skills/planning/SKILL.md": 2_550,
      // Ratcheted 2_260 -> 1_550 at 0.56.x: the ~900-word merge step moved to
      // references/merge-step.md (cold path, reached once on a `pass` verdict), loaded on demand instead
      // of riding every layer. Only the hot-path build loop stays in the always-loaded body.
      // 1_550 -> 1_700 at 0.61.0: absorbed the keep-the-happy-path build discipline (never weaken a test
      // to go green, land-good/park-contentious, the one stop condition) merged in from the global CLAUDE.md.
      "skills/build/SKILL.md": 1_700,
      "skills/agent-protocol/SKILL.md": 450,
      // 600 -> 700 at 0.53.0. This is absorption, not bloat: references/docstrings.md (112 lines) and
      // skills/qa/SKILL.md (67 lines) folded in here and were deleted, so the corpus shrank while this
      // one file grew. Raise a budget only with that kind of receipt.
      "skills/code-rules/SKILL.md": 700,
    };
    const sizes = [];
    for (const [file, budget] of Object.entries(budgets)) {
      const words = stripFrontmatter(readFileSync(join(ROOT, file), "utf8"))
        .split("\n")
        .filter((l) => !l.trim().startsWith("|"))
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;
      assert(words <= budget, `${file} is ${words} prose words — budget is ${budget}. Cut, don't raise the budget.`);
      sizes.push(`${file.split("/")[1]} ${words}/${budget}`);
    }
    return sizes.join(" · ");
  });

  check("every charter preloads agent-protocol, and every preload resolves to a real skill", () => {
    // The shared rules moved from a SubagentStart hook to `skills:` preloads (0.36.0), so delivery now
    // depends on every charter carrying the field and every named skill existing. Either half missing
    // is silent: the agent simply spawns without its rules.
    const charters = lsFiles("'agents/*.md'");
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
    const files = lsFiles("'skills/*.md' 'agents/*.md'");
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
    const strict = [
      "skills/init/block.md",
      "skills/planning/SKILL.md",
      "skills/build/SKILL.md",
      "skills/agent-protocol/SKILL.md",
      "skills/code-rules/SKILL.md",
    ];
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
    // A table row and a list item are their own units. Splitting only on sentence punctuation glued
    // whole bullet lists and table columns into one "sentence" and reported them as 40-word
    // violations, which is why this check sat red against prose that was already inside the limit.
    const sentences = (unit) =>
      unit
        .split("\n")
        .filter((l) => !/^\s*\|/.test(l)) // table rows are scannable facts, not prose
        .join("\n")
        .split(/\n(?=\s*(?:[-*]|\d+\.)\s)/) // each list item stands alone
        // `[*]*` in the lookbehind: a bold lead-in ends `.**`, and without this the heading and the
        // sentence after it counted as one, reporting two-sentence prose as a single 28-word run.
        .flatMap((chunk) => chunk.split(/(?<=[.!?:][*]*)\s+(?=[A-Z*`("“])/));
    const over = [];
    for (const f of strict) {
      for (const u of units(stripFrontmatter(readFileSync(join(ROOT, f), "utf8")))) {
        for (const sent of sentences(u)) {
          if (wc(sent) > 25) over.push(`${f} (${wc(sent)}w): ${sent.trim().replace(/\s+/g, " ").slice(0, 90)}…`);
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
    // response-format.md was deleted at 0.53.0 (1 lifetime read; its unique rules scored 0-2% across
    // 1,021 responses). The shape it carried now lives inline in shared.md, so the check follows it
    // there rather than guarding a path nothing loads.
    const ref = join(ROOT, "skills/init/block.md");
    assert(existsSync(ref), "shared.md is missing — the response shape has no home");
    const text = readFileSync(ref, "utf8");
    for (const needle of ["Restate the request high", "highest level", "examples.yaml"]) {
      assert(text.includes(needle) || text.includes(needle.replace("-", " ")), `shared.md lost: ${needle}`);
    }
    assert(
      !/when one fits/i.test(readFileSync(join(ROOT, "skills/init/block.md"), "utf8")),
      'shared.md still says "when one fits" — that escape hatch is what made the reuse rule a no-op',
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
      "skills/init/block.md": ["MECE", "highest level", "⚠", "ASD-STE100"],
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
    // tasks.yaml dropped at 0.61.0: the task graph moved to the `tasks` MCP server (L5), so block.md now
    // names "the tasks MCP server" instead of a file. The derived .claude/tasks.yaml index is not a
    // hand-authored record set the block must name.
    const docs = ["product.yaml", "roadmap.yaml", "architecture.yaml", "lessons.yaml", "examples.yaml"];
    for (const file of ["skills/init/block.md", "skills/outputty/references/product-template.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const missing = docs.filter((d) => !text.includes(d));
      assert(!missing.length, `${file} does not name: ${missing.join(", ")}`);
    }
    const stale = [];
    const forbidden = [
      /product\.(md|yaml)['’`]?s (Architecture|Status & roadmap|roadmap|target program)/i,
      /Status & roadmap[^.\n]{0,40}in `?product\.(md|yaml)/i,
      // Two forms slipped past this check during the YAML migration and only a whole-build reader
      // caught them. The trail one was blocking: writers said <branch>.md while every reader had moved
      // to <branch>.trail.yaml, so a properly grilled resumed spec got its task graph denied.
      /trails\/(<branch>|\$\{branch\})\.md\b/,
      /`product`\/`roadmap`\/`architecture`\.md/,
    ];
    const files = lsFiles("'skills/*.md' 'agents/*.md'");
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const re of forbidden) if (re.test(text)) stale.push(`${f}: ${text.match(re)[0]}`);
    }
    assert(!stale.length, `section still pointed at the monolith:\n  ${stale.join("\n  ")}`);
    return `6 record sets named by producer+template; ${files.length} shipped files free of monolith refs`;
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

  check("every ${CLAUDE_PLUGIN_ROOT} pointer resolves to a file on disk", () => {
    const files = lsFiles("'*.md'");
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

  check("the reviewer's git range matches what it actually reviews", () => {
    // Master QA runs after every layer was committed, so a `<base>...HEAD` range is the complete and
    // correct view. A working-tree diff would show only whatever is uncommitted — usually nothing —
    // and read exactly like "nothing to review". Silent in both directions, so it is a check.
    // (Per-layer QA reviewed the uncommitted tree and had the opposite requirement. It was removed in
    // 0.48.0: every defect it was meant to catch turned out to be a cross-layer seam it could not see.)
    const qa = readFileSync(join(ROOT, "skills/qa/SKILL.md"), "utf8");
    assert(
      /git diff[^\n`]*\.\.\.HEAD/.test(qa),
      "the qa skill reviews committed history and must use a `<base>...HEAD` range",
    );
    return "master-qa: committed range";
  });
}

// ---------------------------------------------------------------------------
// Green gate
// ---------------------------------------------------------------------------
function gate() {
  group("gate");

  check("prettier: every tracked file is formatted", () => {
    const tracked = lsFiles("'*.md' '*.js' '*.json'");
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
const suites = { tasks, wiring, gate };
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
