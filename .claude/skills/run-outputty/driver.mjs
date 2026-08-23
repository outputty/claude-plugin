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

// One sentence splitter, shared by the ASD-STE100 check and the PR-body linter. It was duplicated once:
// the second copy omitted the list-item rule and glued consecutive bullets into one 60-word "sentence",
// reporting prose that was already inside the limit. Two splitters is one too many.
const sentencesIn = (unit) =>
  unit
    .split("\n")
    .filter((l) => !/^\s*\|/.test(l)) // table rows are scannable facts, not prose
    .join("\n")
    .split(/\n(?=\s*(?:[-*]|\d+\.)\s)/) // each list item stands alone
    // `[*]*` in the lookbehind: a bold lead-in ends `.**`, and without this the heading and the
    // sentence after it counted as one, reporting two-sentence prose as a single 28-word run.
    // `0-9` in the lookahead: a sentence may open on a figure ("195 of its 334 lines were ..."), and
    // without it that sentence merges into the one before and reports as a single over-length run.
    .flatMap((chunk) => chunk.split(/(?<=[.!?:][*]*)\s+(?=[A-Z0-9*`("“])/));
const readDoc = (file) => readFileSync(join(ROOT, file), "utf8");
// Every SKILL.md on disk, tracked or not: a skill added this session is still resident in the listing.
const skillFiles = () =>
  execSync("ls -d skills/*/", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .map((d) => `${d}SKILL.md`)
    .filter((f) => existsSync(join(ROOT, f)));

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

  check("the five product-memory docs are present", () => {
    const docs = ["product.md", "roadmap.md", "architecture.md", "lessons.md", "examples.md"];
    const missing = docs.filter((d) => !existsSync(join(ROOT, ".claude", d)));
    assert(!missing.length, `missing product-memory doc(s): ${missing.join(", ")}`);
    return `${docs.length} product-memory docs present`;
  });

  check("the always-loaded and injected docs stay inside their budgets", () => {
    // Prose-word caps on the docs a session loads. The counter below drops every line that starts with a
    // pipe, so a table row costs nothing and the same content as a list item costs every word.
    // 0.77.0 converted every table in the corpus to an ordered list, which moved those words out of the
    // exempt set and into the count. Every budget below is therefore a NEW baseline, measured after that
    // conversion and set at the measurement plus about 5%; none is comparable to its pre-0.77.0 value.
    // Ratchet a budget DOWN when a cut lands; raise only on a real absorption.
    const budgets = {
      "skills/init/block.md": 1_910, // measures 1_819
      "skills/planning/SKILL.md": 2_360, // measures 2_247
      "skills/build/SKILL.md": 2_390, // measures 2_272
      "skills/code-rules/SKILL.md": 1_170, // measures 1_116
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

  check("shipped docs state things — history lives in lessons.md", () => {
    // A doc that narrates its own past ("this file used to say…", "measured on a real project…")
    // bills every reader for a story whose home is lessons.md. Grep-able tells, so grep them.
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

  check("no shipped markdown carries a table", () => {
    // A table is a hole in every prose gate this harness runs. Three separate filters drop any line whose
    // trimmed form starts with a pipe: the prose-word budget above, `sentencesIn` (so the ASD-STE100 cap),
    // and the PR-body linter's `strip`. So a 40-row table costs zero budget words, can hold 60-word rows
    // under a 25-word cap, and passes the em-dash, CAPS and slash-compound rules untouched — silently, in
    // exactly the files that are held to those rules hardest. 0.77.0 converted the corpus to ordered
    // lists, which is what put that content back under the gates. This check keeps it there.
    // No carve-out: the output style says "Never author a Markdown table", so the lessons archive is held
    // to it too. A gate narrower than the rule it enforces is the rule quietly optional.
    const files = lsFiles("'*.md'");
    const hits = [];
    for (const f of files) {
      readDoc(f)
        .split("\n")
        .forEach((line, i) => {
          if (line.trim().startsWith("|")) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 70)}`);
        });
    }
    assert(!hits.length, `table row(s) — invisible to the budget and the sentence cap:\n  ${hits.join("\n  ")}`);
    return `${files.length} shipped docs, no tables`;
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
    // agent must pass it. These are held at zero because they are the ones nobody opts out of.
    // The rest of the corpus is measured, not gated — a per-file ratchet is the follow-up.
    // output-style.md and init/SKILL.md joined at 0.76.0. The output style STATES the cap, and it broke
    // it six times, which tells every session that reads it that the rule is optional. init writes that
    // style into the repo, so the two files that carry the standard are now held to it.
    const strict = [
      "skills/init/block.md",
      "skills/planning/SKILL.md",
      "skills/build/SKILL.md",
      "skills/code-rules/SKILL.md",
      "skills/init/output-style.md",
      "skills/init/SKILL.md",
      // 0.76.0 ratchet: grill carries the interview a session runs hands-off, and the expert charter is
      // the only agent charter with no gate above it. Both had a sentence over the cap when they
      // joined. `start` joined at 0.80.0, as the skill that now holds the dispatch procedure.
      "skills/grill/SKILL.md",
      "skills/start/SKILL.md",
      "agents/outputty-expert.md",
      // 0.77.0 ratchet: the untested half of the corpus. A rewrite that leaves these over the cap
      // re-creates the split the earlier ratchet was closing, so every shipped Markdown file that a
      // session or a human reads is now gated. lessons.md is an append-only archive, so it stays out.
      ".claude/architecture.md",
      "README.md",
      "docs/security.md",
      "docs/exercised-on.md",
      "skills/audit/SKILL.md",
      "skills/audit/references/audit-playbook.md",
      "skills/bootstrap/SKILL.md",
      "skills/diagram/SKILL.md",
      "skills/documentation/SKILL.md",
      "skills/issue-authoring/SKILL.md",
      "skills/qa/SKILL.md",
      "skills/scout/SKILL.md",
      "skills/adversary/SKILL.md",
      "skills/init/SKILL.md",
      "skills/outputty/references/pr-description.md",
      "skills/outputty/references/product-template.md",
      "agents/outputty-reviewer.md",
      ".claude/product.md",
      ".claude/roadmap.md",
      ".claude/examples.md",
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
    const sentences = sentencesIn;
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
    for (const needle of ["Restate the problem first", "highest level", "canonical example"]) {
      assert(text.includes(needle) || text.includes(needle.replace("-", " ")), `output-style.md lost: ${needle}`);
    }
    // 0.72.0 split the standard by scope: the output style states rules that hold in any repo, and the
    // CLAUDE.md block binds each one to this repo's docs. The `examples.md` pointer moved with its
    // binding, so both halves are still checked - just where each now lives.
    const blockText = readFileSync(join(ROOT, "skills/init/block.md"), "utf8");
    assert(
      blockText.includes(".claude/examples.md"),
      "block.md lost the examples.md binding - the reuse rule in the output style has no target",
    );
    assert(
      !/when one fits/i.test(text),
      'output-style.md still says "when one fits" — that escape hatch is what made the reuse rule a no-op',
    );
    const ex = join(ROOT, ".claude", "examples.md");
    if (!existsSync(ex)) return "no example library in this repo";
    const n = (readFileSync(ex, "utf8").match(/^## /gm) || []).length;
    assert(n >= 3, `examples.md holds ${n} examples — too thin to reuse from, so responses invent their own`);
    return `response-format reachable; ${n} canonical examples available`;
  });

  check("the communication principles ride every delivery doc", () => {
    // MECE grouping, example-led returns, and highest-level-first are delivered mechanically — the output
    // style carries them to the main session AND to every subagent charter that reference-and-loads it
    // (charters check, above). A future trim that drops one silently reverts the behaviour, so the output
    // style is pinned to carry all three; grill keeps its own interview markers.
    const must = {
      "skills/init/output-style.md": ["MECE", "highest level", "⚠", "ASD-STE100"],
      "skills/grill/SKILL.md": ["**Q1**", "Recommend:", "AskUserQuestion"],
    };
    for (const [file, needles] of Object.entries(must)) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const missing = needles.filter((n) => !text.includes(n));
      assert(!missing.length, `${file} lost: ${missing.join(", ")}`);
    }
    // A round asked partly through AskUserQuestion is a round lost: the tool renders 2-4 labels and
    // buries the other questions, so the user answers one and drops the rest. The ban is absolute --
    // any carve-out ("for exactly two shapes", "get this one right first") reopens exactly that hole.
    const grill = readFileSync(join(ROOT, "skills/grill/SKILL.md"), "utf8");
    assert(
      /Never ask a frontier question with `AskUserQuestion`/.test(grill),
      "grill/SKILL.md no longer bans AskUserQuestion for frontier questions",
    );
    assert(
      !/(for exactly two shapes|reserved for)/i.test(grill.split("## Advanced mode")[0]),
      "grill/SKILL.md reopened an AskUserQuestion carve-out in the rounds section",
    );
    return "MECE + example-led + altitude pinned in the output style";
  });

  check("the product-doc split is named consistently by producer and consumers", () => {
    // Product memory is five prose docs, read by role. The shape lives in product-template.md; a
    // consumer still pointing a section at the OLD monolith home ("product.md's Architecture") silently
    // reads a section that no longer exists there. Grep-able drift, so grep it.
    // Tasks live in the `tasks` MCP server (L5), so block.md names "the tasks MCP server", not a file.
    const docs = ["product.md", "roadmap.md", "architecture.md", "lessons.md", "examples.md"];
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
    return `5 docs named by producer+template; ${files.length} shipped files free of monolith refs`;
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
    // The name and the description of every routable skill sit in every session's context, so the listing
    // is a standing tax. The cap is ~1% of context.
    // A skill that sets `disable-model-invocation: true` is filtered out of that listing by the CLI, so it
    // costs nothing here: verified against 2.1.239, whose listing builder drops every command carrying the
    // flag. Counting one would bill a slash-only skill twice and hide a real cut. The authored total is
    // still reported, because a slash-only description is read by a human and still has to earn its words.
    const dirs = execSync("ls -d skills/*/", { cwd: ROOT, encoding: "utf8" }).trim().split("\n");
    let chars = 0;
    let authored = 0;
    let quiet = 0;
    for (const d of dirs) {
      const p = join(ROOT, d, "SKILL.md");
      if (!existsSync(p)) continue;
      const fm = readFileSync(p, "utf8").split("---")[1] ?? "";
      const cost = fm
        .split("\n")
        .filter((l) => /^(name|description):/.test(l))
        .join("\n").length;
      authored += cost;
      if (/^disable-model-invocation:\s*true\s*$/m.test(fm)) quiet += 1;
      else chars += cost;
    }
    const tokens = Math.round(chars / 4);
    assert(tokens < 1000, `skill listing is ~${tokens} est. tokens - over the ~1% context budget`);
    return `${dirs.length} skills, ${quiet} slash-only; ~${tokens} est. tokens resident, ~${Math.round(authored / 4)} authored`;
  });

  check("every ${CLAUDE_PLUGIN_ROOT} pointer resolves to a file on disk", () => {
    // Shipped instruction files only: a consumer session executes these, so their pointers must land.
    // Product memory (`.claude/*.md`) is narrative, not executable — its historical code snippets name
    // files that existed then (e.g. row 22's `tasks.js`), and rewriting that history would falsify it.
    const files = lsFiles("'skills/**/*.md' 'agents/*.md' 'docs/*.md' 'README.md'");
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

  check("master QA judges bundles, and the alias mechanism states where a project row lives", () => {
    // Two rules that fail silently, for the same reason: nothing in a diff shows an unchanged file.
    //   - qa must group the changed files into bundles and read the unchanged members that state a rule
    //     the change depends on. Without it, a contradiction between a changed file and its resident
    //     neighbour is unreachable — the shape that put `list_ready` in block.md twice with opposite
    //     answers, 150 lines apart, past a per-file review.
    //   - block.md is COPIED into a consumer's CLAUDE.md, and `/outputty:init` replaces everything
    //     inside the managed markers. A project alias written inside the block is destroyed on the next
    //     re-run, with no error, so the section must say where a project row actually lives.
    const qa = readDoc("skills/qa/SKILL.md");
    const block = readDoc("skills/init/block.md");
    const problems = [];
    if (!/bundles, never single files/.test(qa)) problems.push("qa: the bundle is no longer the unit of judgement");
    if (!/unchanged bundle member/i.test(qa)) problems.push("qa: nothing reads the unchanged members of a bundle");
    if (!/Two members of one bundle contradict/.test(qa))
      problems.push("qa: a bundle-level contradiction no longer blocks the merge");
    if (!/^## Aliases/m.test(block)) problems.push("block.md: no Aliases section");
    if (!/Project aliases live outside this block/i.test(block))
      problems.push("block.md: does not say a project alias dies inside the managed markers");
    assert(!problems.length, `bundle review or aliases broken:\n  ${problems.join("\n  ")}`);
    return "qa: bundles read and gated · block.md: aliases placed outside the markers";
  });

  check("the conformance ladder is present, gated, and checked", () => {
    // This rule lived in `agents/outputty-builder.md` until 5cd8565 collapsed the agents. That commit
    // itemises everything it relocated; this section is not among them, so it was dropped as collateral
    // and nothing failed, because nothing pinned it. Both halves are pinned now, per the repo's own
    // repeated lesson that a builder rule QA does not check will drift:
    //   - code-rules must carry the tag AND the structural gate. An ungated ladder burns tokens on every
    //     value change; a gate the agent decides for itself is the carve-out that ate the rule in 0.42.0,
    //     which is why the gate is a predicate on the diff, not a judgement about it.
    //   - qa must read structurally-changed files WHOLE. A diff cannot show a sibling, so a reviewer held
    //     to the diff structurally cannot find what this tag is about.
    const rules = readFileSync(join(ROOT, "skills/code-rules/SKILL.md"), "utf8");
    const qa = readFileSync(join(ROOT, "skills/qa/SKILL.md"), "utf8");
    const problems = [];
    if (!/`oddball:`/.test(rules)) problems.push("code-rules: no `oddball:` tag");
    if (!/nearest two/i.test(rules)) problems.push("code-rules: lost the nearest-two-examples rung");
    if (!/structural/i.test(rules)) problems.push("code-rules: `oddball:` is not gated to structural changes");
    if (!/`oddball:`/.test(qa)) problems.push("qa: does not check `oddball:`");
    if (!/structurally/i.test(qa)) problems.push("qa: does not read structurally-changed files whole");
    assert(!problems.length, `conformance ladder broken:\n  ${problems.join("\n  ")}`);
    return "oddball: gated in code-rules, checked in qa";
  });

  check("the expert knowledgebase stays domain-generic and revalidates on use", () => {
    // An expert's base outlives the repo that asked, so anything naming the caller poisons it for every
    // later run. Three halves are pinned, because each fails silently on its own:
    //   - the portability test, which is what makes "generic" checkable instead of a matter of taste;
    //   - the checkout-path ban, the concrete form the leak actually takes (0.4.0's own worked example
    //     footnoted a project's ranker and its replay test, teaching the anti-pattern);
    //   - validate-on-use, which is what keeps an evergrowing base affordable. Drop it and the charter
    //     reverts to re-checking every prior every run, so growth costs quadratically and the base gets
    //     pruned to stay cheap — exactly what "evergrowing" is meant to prevent.
    const x = readFileSync(join(ROOT, "agents/outputty-expert.md"), "utf8");
    const problems = [];
    if (!/portability test/i.test(x)) problems.push("no portability test — 'generic' becomes taste");
    if (!/node_modules/.test(x)) problems.push("the checkout-path ban does not name the paths it bans");
    if (!/@<version>|@7\.1\.0|<package>@/.test(x)) problems.push("no generic citation form to replace repo paths");
    if (!/only the claims you actually use|validate on use/i.test(x))
      problems.push("revalidation is not scoped to used claims");
    if (!/kind: website|\bwebsite\b/i.test(x)) problems.push("revalidation does not split by source kind");
    if (!/## Index/.test(x)) problems.push("no shard index — a large domain cannot be split");
    assert(!problems.length, `expert knowledgebase contract broken:\n  ${problems.join("\n  ")}`);
    return "expert: generic, sharded, validate-on-use";
  });

  check("the output style pins the call-stack shape and the confirm-first rule", () => {
    // Both rules are about a SHAPE, so prose alone cannot carry them. The call-stack example is the only
    // fenced block in an otherwise prose-only file - a deliberate `oddball:`, because the style must
    // work in a repo that has no examples.md to point at. Its tabs are the format, so they are checked
    // as tabs; a reformat to spaces would silently change what the rule teaches.
    // The confirm-first rule is scoped to interactive work: an unattended build that fires
    // AskUserQuestion stalls in a pane nobody is watching, and a subagent review has no such tool at all.
    const x = readFileSync(join(ROOT, "skills/init/output-style.md"), "utf8");
    const problems = [];
    if (!/call stack graph/i.test(x)) problems.push("no call-stack rule");
    if (!/never their parameters/i.test(x)) problems.push("call-stack rule does not exclude parameters");
    if (!/^\t+\w+\(\)/m.test(x)) problems.push("no tab-indented worked example — the shape has no shape");
    if (!/AskUserQuestion/.test(x)) problems.push("no confirm-first rule");
    if (!/unattended work never asks/i.test(x)) problems.push("confirm-first is not scoped to interactive work");
    assert(!problems.length, `output style contract broken:\n  ${problems.join("\n  ")}`);
    return "output style: call-stack shape + confirm-first";
  });

  check("the output style points at no installer of its own", () => {
    // The standard is split by scope: the output style states rules that hold in ANY repo, and the
    // CLAUDE.md block binds each one to this repo's docs. The style is COPIED into a consumer repo as a
    // standalone file, and it is read by sessions and by every charter that loads it — none of which is
    // installing anything. A style that names `CLAUDE.md`, the outputty block or `/outputty:init` points
    // upward at its own installer, so a reader inherits a wiring instruction as if it were a writing rule.
    // Nothing fails loudly: the sentence just reads as advice about a file the reader has no reason to open.
    const body = stripFrontmatter(readDoc("skills/init/output-style.md"));
    const upward = ["CLAUDE.md", "outputty block", "/outputty:init"].filter((n) => body.includes(n));
    assert(!upward.length, `the output style names its installer: ${upward.join(", ")}`);
    return "output style: writing rules only, no wiring";
  });

  check("master QA names no role above it", () => {
    // qa is dispatched read-only against a diff, and it is the ONE stage that also runs standalone in a
    // repo with no orchestrator and no watcher pane. Naming either makes the reviewer address, wait on or
    // defer to a role that is simply absent, and the failure is silent in the worst direction: the review
    // finishes and reports, having quietly skipped whatever it decided was somebody else's call.
    const upward = ["orchestrator", "watcher"].filter((n) => new RegExp(n, "i").test(readDoc("skills/qa/SKILL.md")));
    assert(!upward.length, `qa/SKILL.md names a role above it: ${upward.join(", ")}`);
    return "qa: no upward reference";
  });

  check("a build publishes what it understood before it builds", () => {
    // A build session is unattended, so its reading of the ticket was invisible: it validated the ticket
    // (the layer loop's four questions) and wrote the failing test first, and emitted neither. Both rules
    // already existed; what was missing was an artifact. Pinned here:
    //   - the stage exists and is unconditional, because a self-granted short form is the carve-out
    //     pattern that ate the AskUserQuestion rule in 0.42.0;
    //   - it lands in the TRAIL, not only the pane. A pane report dies at the next compaction and QA
    //     never sees which assumptions the build carried;
    //   - claims carry grill's verdict vocabulary, so SPEC and BUILD grade evidence the same way rather
    //     than growing two ledgers for one job;
    //   - an Unknown is either a replan or a recorded assumption. Without that, "unknown" becomes the
    //     place a requirements gap hides instead of firing the replan exit.
    const b = readFileSync(join(ROOT, "skills/build/SKILL.md"), "utf8");
    const problems = [];
    if (!/## ORIENTATION/.test(b)) problems.push("no ORIENTATION stage");
    if (!/no exception/i.test(b)) problems.push("ORIENTATION is not unconditional");
    if (!/append_trail/.test(b.split("## BUILD")[0])) problems.push("the report never reaches the trail");
    for (const v of ["Grounded", "Absent", "Unknown"]) {
      if (!new RegExp(`\\*\\*${v}\\*\\*`).test(b)) problems.push(`claim ledger lost the ${v} verdict`);
    }
    if (!/blocking → \*\*replan\*\*/.test(b)) problems.push("an Unknown no longer routes to the replan exit");
    if (!/call stack graph/.test(b)) problems.push("no landing graph in the drafted solution");
    assert(!problems.length, `orientation contract broken:\n  ${problems.join("\n  ")}`);
    return "orientation: ledger + trail + landing graph";
  });

  check("the reviewer's effort is pinned where a dispatch can hold it", () => {
    // The Agent tool takes `{description, prompt, subagent_type, model, run_in_background}` and no effort.
    // So "dispatched at opus and xhigh" was prose that nothing could execute. Agent frontmatter DOES accept
    // `effort`, so the charter is the one place that holds it, and every caller points there.
    // The model is the opposite: the charter pins none and the dispatch passes none, so the reviewer
    // inherits the parent session's model, which the task's `tier` already chose (0.77.0, user ruling). A
    // dispatch that names a model would silently override that tier. qa is the callee and already carries
    // the charter, so naming it there is an upward reference the output style bans.
    const fm = readDoc("agents/outputty-reviewer.md").split("---")[1] ?? "";
    const problems = [];
    if (!/^effort:\s*xhigh\s*$/m.test(fm))
      problems.push("agents/outputty-reviewer.md: frontmatter lost `effort: xhigh`");
    if (!/inherit the dispatching session's model/.test(readDoc("agents/outputty-reviewer.md")))
      problems.push("agents/outputty-reviewer.md: lost the rule that the reviewer inherits the parent model");
    if (/^model:/m.test(fm)) problems.push("agents/outputty-reviewer.md: pins a model, so it cannot inherit");
    const dispatcher = readDoc("skills/build/SKILL.md");
    if (!/charter's\s+`effort: xhigh`/.test(dispatcher))
      problems.push("skills/build/SKILL.md: no longer points at the charter for effort");
    if (/`?model: opus`?/.test(dispatcher))
      problems.push("skills/build/SKILL.md: the dispatch names a model, overriding the tier the task chose");
    for (const f of ["skills/qa/SKILL.md", "skills/build/SKILL.md"]) {
      if (/opus\/xhigh/.test(readDoc(f))) problems.push(`${f}: promises an effort the dispatch cannot set`);
    }
    if (/charter's\s+`effort: xhigh`/.test(readDoc("skills/qa/SKILL.md")))
      problems.push("skills/qa/SKILL.md: names the charter that already loaded it - an upward reference");
    assert(!problems.length, `reviewer effort unpinned:\n  ${problems.join("\n  ")}`);
    return "reviewer: effort fixed in the charter, cited by both callers";
  });

  check("master QA's diff base resolves, and an empty range stops the review", () => {
    // A hardcoded `origin/main` fails to resolve on a repo whose default is `master`, on a fork, and in a
    // worktree with no fetched ref. `git merge-base` then fails, `BASE` is empty, and `git diff $BASE...HEAD`
    // degrades to a command that exits 0 and prints nothing. The reviewer reads that as a clean build and
    // passes it. Both halves are pinned: the base is resolved from `origin/HEAD`, and a zero commit count
    // is a stop. audit tags `introduced` against `pre-existing` off the same base, so it fetches first.
    const qa = readDoc("skills/qa/SKILL.md");
    const audit = readDoc("skills/audit/SKILL.md");
    const resolves = /symbolic-ref --quiet --short refs\/remotes\/origin\/HEAD/;
    const problems = [];
    if (!resolves.test(qa)) problems.push("qa: the diff base does not resolve the default branch");
    if (!/rev-list --count \$BASE\.\.HEAD/.test(qa)) problems.push("qa: nothing counts the commits under review");
    if (!/count of 0 means the range is wrong/i.test(qa))
      problems.push("qa: an empty range no longer stops the review");
    if (!resolves.test(audit)) problems.push("audit: the branch variant does not resolve the default branch");
    if (!/git fetch origin/.test(audit)) problems.push("audit: no fetch, so `introduced` is tagged off a stale base");
    assert(!problems.length, `diff base unguarded:\n  ${problems.join("\n  ")}`);
    return "qa + audit: base resolved, empty range guarded";
  });

  check("the reviewer charter states the whole read-only boundary", () => {
    // scout, adversary and qa each carried their own copy of "read-only", and each copy said something
    // different. The charter loads on every dispatch, so it is the single home, and the bodies now delete
    // theirs. That only works if this copy is complete: an unenumerated ban reads as advisory, and the old
    // wording forbade the `git merge-base` that qa's own procedure mandates. The run exception rides with
    // the rule, because a build that needs a compile step to start is not a build a reviewer may fix.
    const x = readDoc("agents/outputty-reviewer.md");
    const problems = [];
    if (!/`tasks`\s*\n?\s*server included|`tasks` server/.test(x))
      problems.push("the MCP write ban does not name the `tasks` server");
    for (const verb of ["`diff`", "`log`", "`rev-list`", "`rev-parse`", "`merge-base`", "`show`", "`fetch`"]) {
      if (!x.includes(verb)) problems.push(`the permitted git verbs no longer list ${verb}`);
    }
    if (!/Every other git verb counts as a write/.test(x))
      problems.push("the allowlist has no closing rule, so it reads as examples");
    if (!/part of the run, not a fix/.test(x))
      problems.push("the compile-step exception is gone, so a reviewer either edits or stalls");
    assert(!problems.length, `read-only boundary incomplete:\n  ${problems.join("\n  ")}`);
    return "reviewer: enumerated allowlist + the run exception";
  });

  check("the copied CLAUDE.md block resolves the plugin root itself", () => {
    // block.md is copied verbatim into a consumer's CLAUDE.md, and no shell there exports
    // `${CLAUDE_PLUGIN_ROOT}`. A pointer written in that form expands to a path starting at the filesystem
    // root, so it lands nowhere and the reader improvises. The block resolves the cache path first and
    // points with `$PLUGIN_ROOT`. Every other shipped file is read by the plugin, so the variable is
    // correct there; this check is scoped to the one file that leaves the plugin.
    const b = readDoc("skills/init/block.md");
    const problems = [];
    if (!/PLUGIN_ROOT=\$\(ls -d ~\/\.claude\/plugins\/cache/.test(b))
      problems.push("no resolution line for the plugin cache path");
    const bare = [...b.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/[\w./-]+/g)].map((m) => m[0]);
    if (bare.length) problems.push(`pointer(s) that cannot expand in a copied block: ${bare.join(", ")}`);
    assert(!problems.length, `copied block cannot reach the plugin:\n  ${problems.join("\n  ")}`);
    return "block.md: cache path resolved, pointers relative to it";
  });

  check("`list_ready` is described as a queue that excludes claimed work", () => {
    // The catalogue cell and the orchestrator doctrine disagreed: one said the ranked list includes tasks
    // already being worked, the other said a child's first act is `start_task`. An orchestrator that
    // believes the first re-dispatches a task another pane already holds, and two stacks then collide on
    // one branch. The doctrine wins, so the wording is pinned and the losing claim is pinned out.
    assert(
      /already excludes what a child has claimed/.test(readDoc("skills/init/block.md")),
      "block.md: the `list_ready` cell no longer says the queue excludes claimed work",
    );
    const stale = [];
    for (const f of [...skillFiles(), "skills/init/block.md", "README.md"]) {
      for (const line of readDoc(f).split("\n")) {
        if (/list_ready/.test(line) && /already being (worked|built)|including (tasks|work) already/i.test(line)) {
          stale.push(`${f}: ${line.trim().slice(0, 90)}`);
        }
      }
    }
    assert(!stale.length, `\`list_ready\` claimed to list in-flight work:\n  ${stale.join("\n  ")}`);
    return "list_ready: one doctrine, claimed work excluded";
  });

  check("the two-stage diagram stays one drawing in both homes", () => {
    // README.md and the CLAUDE.md block ship the same picture. They drifted on the mechanism: one said the
    // build runs on a sweep, the other said the channel wakes it. A reader who believes the sweep waits
    // for a poll that nothing runs. The block wins, and the copy is pinned character for character, so the
    // next edit to either file fails here instead of teaching two flows.
    const pick = (f) => {
      const hit = (readDoc(f).match(/```text\n[\s\S]*?```/g) || []).find(
        (b) => b.includes("PLANNING") && b.includes("BUILD"),
      );
      assert(hit, `${f}: the two-stage diagram is gone`);
      return hit;
    };
    const block = pick("skills/init/block.md").split("\n");
    const readme = pick("README.md").split("\n");
    // Walk the longer of the two, so a copy that only appends a line still reports the line it added.
    const longest = Math.max(block.length, readme.length);
    let at = -1;
    for (let i = 0; i < longest; i += 1) {
      if (block[i] !== readme[i]) {
        at = i;
        break;
      }
    }
    assert(
      at === -1,
      `the two-stage diagram drifted at line ${at + 1}:\n  block.md:  ${block[at] ?? "(missing)"}\n  README.md: ${readme[at] ?? "(missing)"}`,
    );
    return `two-stage diagram: ${block.length} lines, identical in both`;
  });

  check("the brief and the contract have one field spec", () => {
    // Four files specified these two fields, and they disagreed. planning described a brief as end-state
    // prose while issue-authoring opens it with current behaviour, so a brief written to planning produced
    // an issue whose Problem section never said what was wrong. issue-authoring wins, because it is what
    // the server renders. The others carry a pointer and the shape, never a second semantics.
    const spec = "skills/issue-authoring/SKILL.md";
    assert(/Required on every brief/.test(readDoc(spec)), `${spec}: lost the Sibling row, the one required reference`);
    const owners = [...skillFiles(), "README.md", "skills/outputty/references/product-template.md"].filter((f) =>
      /Required on every brief|A brief is the PR description, written forward/.test(readDoc(f)),
    );
    assert(
      owners.length === 1 && owners[0] === spec,
      `the brief field spec has ${owners.length} homes: ${owners.join(", ")}`,
    );
    for (const f of ["skills/planning/SKILL.md", "skills/outputty/references/product-template.md"]) {
      assert(
        readDoc(f).includes("skills/issue-authoring/SKILL.md"),
        `${f}: writes a brief with no pointer at the field spec`,
      );
    }
    return "brief + contract: specified once, in issue-authoring";
  });

  check("no shipped skill names this repo's own harness", () => {
    // `driver` means `.claude/skills/run-outputty/driver.mjs`, which exists in this repository and nowhere
    // else. An unattended build in a consumer repo that reads "the driver is your early warning" meets an
    // undefined noun, and it either invents a script or drops the rule. The shipped name for the same idea
    // is `CHECKS`, which the ticket supplies. references/ may name the harness, because it documents this
    // repo's own PR-body command with the path beside it.
    const hits = [];
    for (const f of [...skillFiles(), ...lsFiles("'agents/*.md'")]) {
      if (/\bdrivers?\b/i.test(readDoc(f))) hits.push(f);
    }
    assert(!hits.length, `a repo-only file named in shipped instructions:\n  ${hits.join("\n  ")}`);
    assert(
      /`CHECKS` is your early warning/.test(readDoc("skills/build/SKILL.md")),
      "build/SKILL.md lost the early-warning rule that `CHECKS` anchors",
    );
    return "shipped skills: no harness noun, `CHECKS` anchored";
  });

  check("ALL-CAPS in the corpus is a fixed token, never emphasis", () => {
    // The prbody suite has caught shouted emphasis in a PR body since 0.72.0, and the corpus that states
    // the rule was never held to it: eleven shipped files used ALL-CAPS to stress a word they wrote
    // lowercase two lines later. Same detector, same comparison, now on the files a session loads.
    // TOKENS is the project's own vocabulary: stage names, brief field labels, and acronyms. A word that
    // is not in it, and that the same file also writes lowercase, is emphasis - use bold instead.
    const TOKENS = new Set([
      "SPEC",
      "PLAN",
      "BUILD",
      "PLANNING",
      "MERGE",
      "SETTLE",
      "SETTLED",
      "DEFERRED",
      "JUDGE",
      "THE",
      "REAL",
      "RUN",
      "LOOP",
      "MASTER",
      "STALE",
      "HIGH",
      "LOW",
      "MCP",
      "JSON",
      "XML",
      "SVG",
      "CLI",
      "API",
      "URL",
      "ALL",
      "BEFORE",
      "AFTER",
      "MECE",
      "MIT",
      "UI",
      "OS",
      "QA",
    ]);
    const files = new Set(
      [...skillFiles(), ...lsFiles("'skills/**/references/*.md' 'agents/*.md' '.claude/*.md' 'README.md'")].filter(
        (f) => f !== ".claude/lessons.md",
      ),
    );
    const hits = [];
    for (const f of files) {
      const masked = stripFrontmatter(readDoc(f))
        .replace(/```[\s\S]*?```/g, "\n\n")
        .replace(/`[^`\n]*`/g, "code")
        .replace(/\b[A-Z][A-Za-z]*\.(md|json|js|mjs|sh|ts|yaml|yml|toml)\b/g, "file");
      const shouty = [...new Set(masked.match(/\b[A-Z]{2,}\b/g) || [])]
        .filter((w) => !TOKENS.has(w))
        .filter((w) => new RegExp(`\\b${w.toLowerCase()}\\b`).test(masked));
      if (shouty.length) hits.push(`${f}: ${shouty.join(", ")}`);
    }
    assert(
      !hits.length,
      `CAPS for emphasis (the same word is lowercase elsewhere in the file):\n  ${hits.join("\n  ")}`,
    );
    return `${files.size} shipped docs, no shouted emphasis`;
  });

  check("the init installer passes its own self-test", () => {
    // Every other check here proves a sentence survived a trim. This one runs the code. install.sh writes
    // four files into a repository the user already owns, so its failures are destructive and quiet: a
    // note spliced away, a settings key clobbered, a block duplicated on the second run. selftest.sh
    // exercises those cases plus the `master`-default resolution against scratch repos under a temp dir,
    // and it touches nothing here. It costs about a second, so it runs on every driver run.
    const script = "skills/init/scripts/selftest.sh";
    assert(existsSync(join(ROOT, script)), `${script} is missing, so nothing exercises install.sh on a real repo`);
    try {
      execFileSync("bash", [join(ROOT, script)], { cwd: ROOT, encoding: "utf8", stdio: "pipe", timeout: 120000 });
    } catch (e) {
      // The script names its own failing case on a `FAIL:` line. A node stack trace from the JSON asserts
      // lands in the same stream, so prefer the named case and fall back to the tail.
      const lines = ((e.stdout || "") + (e.stderr || "")).trim().split("\n");
      const named = lines.filter((l) => l.startsWith("FAIL:"));
      const tail = (named.length ? named : lines.slice(-4)).join("\n  ");
      assert(false, `install.sh failed its own self-test:\n  ${tail}`);
    }
    return "install.sh: 4 scratch-repo cases pass";
  });
}

// ---------------------------------------------------------------------------
// PR body — `node driver.mjs prbody <file>`; silent when no file is given
// ---------------------------------------------------------------------------
function prbody() {
  const path = process.argv[3] || process.env.PR_BODY;
  if (!path) return;
  group("prbody");

  // A body is prose a human reads cold, so the writing standard applies to it. It was not being
  // applied: PR #496 was format-perfect and still broke the style in 30% of its sentences, because
  // pr-description.md governs structure and the output style governs prose and neither names the other.
  const raw = readFileSync(path, "utf8");
  const strip = (t) =>
    t
      .replace(/```[\s\S]*?```/g, "\n\n")
      .replace(/https?:\/\/\S+/g, "url")
      .split("\n")
      .filter((l) => !l.trim().startsWith("|"))
      .join("\n");
  // Two views. Sentence rules read the identifier as it renders, because `mart` opens a sentence on a
  // lowercase letter exactly like a bare word does. The slash and CAPS rules read it masked, because a
  // path inside backticks is neither a slash compound nor shouting.
  const prose = strip(raw).replace(/`([^`\n]*)`/g, "$1");
  const masked = strip(raw).replace(/`[^`\n]*`/g, "code");
  const sentences = prose
    .split("\n\n")
    .flatMap((p) => sentencesIn(p))
    .map((x) => x.replace(/\n/g, " ").trim())
    .filter((x) => x.length > 3 && !x.startsWith("#"));
  const words = (x) =>
    x
      .replace(/[`*_[\]()]/g, "")
      .split(/\s+/)
      .filter(Boolean).length;

  check("no em dashes", () => {
    const n = (prose.match(/—/g) || []).length;
    assert(!n, `${n} em dash(es): the style bans them. Use a spaced hyphen, a colon, or a full stop.`);
    return "clean";
  });

  check("every sentence is inside ASD-STE100's 25-word cap", () => {
    const over = sentences.filter((x) => words(x) > 25);
    assert(
      !over.length,
      `${over.length} over the cap:\n  ${over.map((x) => `${words(x)}w ${x.slice(0, 80)}…`).join("\n  ")}`,
    );
    return `${sentences.length} sentences, longest ${Math.max(...sentences.map(words))}w`;
  });

  check("no sentence opens on a lowercase identifier", () => {
    const bad = sentences.filter((x) => /^[a-z]/.test(x));
    assert(!bad.length, `reorder so a capital starts the line:\n  ${bad.map((x) => x.slice(0, 70)).join("\n  ")}`);
    return "clean";
  });

  check("no slash compounds, no CAPS for emphasis", () => {
    const problems = [];
    // Report surrounding words: a bare "code/the" match is correct but unfindable in the source.
    const slashes = [...new Set((masked.match(/\S*\b[a-z]+\/[a-z]+\b\S*/g) || []).map((m) => m.trim()))];
    if (slashes.length) problems.push(`slash compounds (write the conjunction): ${slashes.join(", ")}`);
    // A word shouted here but written normally elsewhere in the same body is emphasis, not an acronym.
    // That comparison needs no dictionary and never fires on INTEGER, JSON or a type name.
    // A token immediately followed by a file extension is a filename (AGENTS.md, README.md), not
    // shouting, so it is stripped before the comparison.
    const noFiles = masked.replace(/\b[A-Z][A-Za-z]*\.(md|json|js|mjs|sh|ts|yaml|yml|toml)\b/g, "file");
    const shouty = [...new Set(noFiles.match(/\b[A-Z]{3,}\b/g) || [])].filter((w) =>
      new RegExp(`\\b${w.toLowerCase()}\\b`).test(noFiles),
    );
    if (shouty.length) problems.push(`CAPS for emphasis (written lowercase elsewhere): ${shouty.join(", ")}`);
    assert(!problems.length, problems.join("\n  "));
    return "clean";
  });

  check("every section heading reuses its summary bullet", () => {
    // The format ties heading to bullet so a reader can map summary onto detail. #496 drifted on two of
    // three, which is why its summary could not be used as an index.
    const summary = (raw.split(/^## Summary\s*$/m)[1] || "").split(/^## /m)[0];
    const bullets = (summary.match(/^- .+$/gm) || []).map((b) =>
      b.replace(/^- /, "").replace(/[`*_]/g, "").toLowerCase(),
    );
    // Multi-problem bodies map their `# Problem N:` headings to the bullets; single-problem bodies map
    // their `## ` sections. Without this branch the check reads a multi-problem body as zero headings
    // and passes on the one format that most needs it.
    const problems = (raw.match(/^# Problem \d+[:.] .+$/gm) || []).map((h) =>
      h
        .replace(/^# Problem \d+[:.] /, "")
        .replace(/[`*_]/g, "")
        .toLowerCase(),
    );
    const heads = problems.length
      ? problems
      : (raw.match(/^## .+$/gm) || [])
          .map((h) => h.replace(/^## /, "").replace(/[`*_]/g, "").toLowerCase())
          .filter((h) => !/^(summary|what we|what was tried|keep in mind)/.test(h));
    assert(heads.length, "no sections found to map onto the summary");
    const key = (t) => new Set(t.split(/\W+/).filter((w) => w.length > 3));
    const orphans = heads.filter((h) => {
      const hk = key(h);
      return !bullets.some((b) => [...hk].filter((w) => key(b).has(w)).length >= Math.min(2, hk.size));
    });
    assert(!orphans.length, `heading(s) with no matching summary bullet:\n  ${orphans.join("\n  ")}`);
    return `${heads.length} headings mapped to ${bullets.length} bullets`;
  });
}

// ---------------------------------------------------------------------------
// Green gate
// ---------------------------------------------------------------------------
function gate() {
  group("gate");

  check("prettier: every tracked file is formatted", () => {
    // `*.mjs` joined the patterns at 0.76.0. It matched nothing before, so this harness was the one
    // tracked source file exempt from the format gate it runs, and it had drifted.
    const tracked = lsFiles("'*.md' '*.js' '*.mjs' '*.json'");
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
const suites = { wiring, prbody, gate };
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
