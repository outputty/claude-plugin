#!/usr/bin/env node
// outputty driver — exercises the plugin's executable surface end to end.
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

// Tracked files that are also present on disk.
const lsFiles = (patterns) =>
  execSync(`git ls-files ${patterns}`, { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((f) => existsSync(join(ROOT, f)));

const stripFrontmatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, "");

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function wiring() {
  group("wiring");

  check("every plugin executable is invoked through ${CLAUDE_PLUGIN_ROOT}", () => {
    const files = lsFiles("'agents/*.md' 'skills/**/*.md' 'README.md'");
    const bare = [];
    for (const f of files) {
      for (const line of readFileSync(join(ROOT, f), "utf8").split("\n")) {
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

  check("every docs.js query named in a shipped instruction still answers", () => {
    const files = lsFiles("'agents/*.md' 'skills/**/*.md'");
    const invocations = new Set();
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const m of text.matchAll(/docs\.js"?\s+([a-z_]+)\s+--section\s+([a-z_]+)/g)) {
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

  check("every committed product-memory YAML parses", () => {
    const files = lsFiles("'.claude/*.yaml' '.claude/**/*.yaml'");
    assert(files.length >= 5, `expected the product-doc set, found ${files.length}`);
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

  check("the always-loaded and injected docs stay inside their budgets", () => {
    // Prose-word caps on the docs a session loads (table rows exempt — the filter below drops them).
    // Ratchet a budget DOWN when a cut lands; raise only on a real absorption.
    const budgets = {
      "skills/init/block.md": 1_680,
      "skills/planning/SKILL.md": 2_580,
      "skills/build/SKILL.md": 1_930,
      "skills/code-rules/SKILL.md": 650,
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

  check("every charter reference-and-loads the output style, and any skills: preload resolves", () => {
    // An output style never reaches a subagent — proven by spike, and stated in the sub-agents docs. So
    // each charter must READ the installed output style itself (`skills/init/output-style.md`), the
    // reference-and-load pointer. A charter that drops it spawns without the writing standard, silently.
    // (This replaced the agent-protocol `skills:` preload: block.md's always-on rules now reach subagents
    // directly, so only the writing standard — which the output style owns — needs an explicit load.)
    const charters = lsFiles("'agents/*.md'");
    const problems = [];
    for (const f of charters) {
      const text = readFileSync(join(ROOT, f), "utf8");
      if (!text.includes("skills/init/output-style.md")) problems.push(`${f}: does not load the output style`);
      // Any skills: preload that a charter still carries must resolve to a real skill.
      const fm = text.split("---")[1] ?? "";
      const m = fm.match(/^skills:\s*\[([^\]]*)\]/m);
      if (m) {
        for (const n of m[1]
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)) {
          if (!existsSync(join(ROOT, "skills", n, "SKILL.md"))) problems.push(`${f}: preloads missing skill '${n}'`);
        }
      }
    }
    assert(!problems.length, `charter gaps:\n  ${problems.join("\n  ")}`);
    return `${charters.length} charters, all reference-and-loading the output style`;
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
    // The response shape lived in block.md until 0.61.0, when the whole writing standard moved to the
    // installed output style (`skills/init/output-style.md`); the check follows it there.
    const ref = join(ROOT, "skills/init/output-style.md");
    assert(existsSync(ref), "output-style.md is missing — the response shape has no home");
    const text = readFileSync(ref, "utf8");
    for (const needle of ["Restate the problem first", "highest level", "examples.yaml"]) {
      assert(text.includes(needle) || text.includes(needle.replace("-", " ")), `output-style.md lost: ${needle}`);
    }
    assert(
      !/when one fits/i.test(text),
      'output-style.md still says "when one fits" — that escape hatch is what made the reuse rule a no-op',
    );
    const ex = join(ROOT, ".claude", "examples.yaml");
    if (!existsSync(ex)) return "no example library in this repo";
    const n = (readFileSync(ex, "utf8").match(/^- name:/gm) || []).length;
    assert(n >= 3, `examples.yaml holds ${n} examples — too thin to reuse from, so responses invent their own`);
    return `response-format reachable; ${n} canonical examples available`;
  });

  check("the communication principles ride every delivery doc", () => {
    // MECE grouping, example-led returns, and highest-level-first are delivered mechanically — the output
    // style carries them to the main session AND to every subagent charter that reference-and-loads it
    // (charters check, above). A future trim that drops one silently reverts the behaviour, so the output
    // style is pinned to carry all three; grill keeps its own interview markers.
    const must = {
      "skills/init/output-style.md": ["MECE", "highest level", "⚠", "ASD-STE100"],
      "skills/grill/SKILL.md": ["❓", "➡️", "AskUserQuestion"],
    };
    for (const [file, needles] of Object.entries(must)) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const missing = needles.filter((n) => !text.includes(n));
      assert(!missing.length, `${file} lost: ${missing.join(", ")}`);
    }
    return "MECE + example-led + altitude pinned in the output style";
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
      // A form that slipped past this check during the YAML migration and only a whole-build reader
      // caught: naming the split record sets as one `.md` monolith.
      /`product`\/`roadmap`\/`architecture`\.md/,
    ];
    const files = lsFiles("'skills/*.md' 'agents/*.md'");
    for (const f of files) {
      const text = readFileSync(join(ROOT, f), "utf8");
      for (const re of forbidden) if (re.test(text)) stale.push(`${f}: ${text.match(re)[0]}`);
    }
    assert(!stale.length, `section still pointed at the monolith:\n  ${stale.join("\n  ")}`);
    return `5 record sets named by producer+template; ${files.length} shipped files free of monolith refs`;
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
const suites = { wiring, gate };
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
