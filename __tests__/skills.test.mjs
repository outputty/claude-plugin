// Every skill and output style follows the skill rubric: each check names the rubric rule it enforces.
// Spec: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
// and https://code.claude.com/docs/en/skills
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, extname, basename } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SKILL_ROOTS = ["templates/skills", "skills"];
const OUTPUT_STYLES = "output-styles";
const SCRIPT_EXTENSIONS = new Set([".ts", ".mjs", ".js", ".sh", ".py"]);
const XML_TAG = /<[a-zA-Z][^>]*>/;
const BACKSLASH_PATH = /\b[\w-]+(?:\\[\w-][\w.-]*)+\.[a-z]{1,5}\b/i;

/**
 * Lists every file under a directory, recursively.
 * Caller owes an existing directory. `skills/plan` → [`skills/plan/SKILL.md`, ...]
 */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/**
 * Lists the absolute folder of every skill: a direct child of a skill root holding a SKILL.md.
 * `templates/skills` → [`<root>/templates/skills/build`, ...]
 */
function skillFolders() {
  return SKILL_ROOTS.flatMap((root) =>
    readdirSync(join(ROOT, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(ROOT, root, entry.name))
      .filter((folder) => existsSync(join(folder, "SKILL.md"))),
  );
}

/**
 * Splits a markdown file into its `---` delimited frontmatter, as flat key/value strings, and its body.
 * Throws when the file does not open with a closed frontmatter block.
 * Indented lines continue the previous key's value, so folded YAML scalars still read whole.
 * `---\nname: a\n---\nbody` → { data: { name: "a" }, body: "body" }
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("no --- delimited frontmatter at the top of the file");
  const data = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (pair) {
      key = pair[1];
      data[key] = unquote(pair[2]);
      continue;
    }
    if (!key || !/^\s+\S/.test(line)) continue;
    data[key] = `${data[key]} ${line.trim()}`.trim();
  }
  return { data, body: match[2] };
}

/**
 * Strips one pair of matching YAML quotes and a bare folded-scalar marker from a value.
 * `"a b"` → `a b`, `>` → ``
 */
function unquote(value) {
  const trimmed = value.trim();
  if (/^[>|][-+]?$/.test(trimmed)) return "";
  if (/^(["']).*\1$/.test(trimmed)) return trimmed.slice(1, -1);
  return trimmed;
}

/**
 * Lists the targets of the relative markdown links in a text, without anchors; code spans and external URLs are skipped.
 * `[a](b.md#x) [c](https://d)` → [`b.md`]
 */
function relativeLinks(text) {
  const prose = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  return [...prose.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map((match) => match[1].split("#")[0])
    .filter((target) => target && !/^[a-z][a-z0-9+.-]*:/i.test(target));
}

/**
 * Counts a text's lines, not counting the empty string after a trailing newline.
 * `a\nb\n` → 2
 */
function lineCount(text) {
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

for (const folder of skillFolders()) {
  const name = relative(ROOT, folder);
  const skillPath = join(folder, "SKILL.md");
  const skillText = readFileSync(skillPath, "utf8");
  const files = walk(folder);
  const markdown = files.filter((file) => extname(file) === ".md");
  const references = markdown.filter((file) => file !== skillPath);

  describe(name, () => {
    test("R1/R2/R17 frontmatter: name, description, when_to_use, no model key", () => {
      const where = `${name}/SKILL.md`;
      const { data } = parseFrontmatter(skillText);
      assert.match(data.name ?? "", /^[a-z0-9-]{1,64}$/, `${where}: name must be 1-64 chars of [a-z0-9-]`);
      assert.doesNotMatch(data.name, /anthropic|claude/i, `${where}: name must not contain "anthropic" or "claude"`);
      assert.ok(data.description, `${where}: description must be non-empty`);
      assert.ok(
        data.description.length <= 1024,
        `${where}: description is ${data.description.length} chars, over 1024`,
      );
      assert.doesNotMatch(data.description, XML_TAG, `${where}: description must hold no XML tag`);
      const combined = data.description.length + (data.when_to_use ?? "").length;
      assert.ok(combined <= 1536, `${where}: description + when_to_use is ${combined} chars, over 1536`);
      assert.ok(!("model" in data), `${where}: frontmatter must not set "model"`);
    });

    test("R3 SKILL.md body under 500 lines", () => {
      const lines = lineCount(parseFrontmatter(skillText).body);
      assert.ok(lines < 500, `${name}/SKILL.md: body is ${lines} lines, not under 500`);
    });

    test("R4 a reference file over 100 lines opens with ## Contents", () => {
      for (const file of references) {
        const lines = readFileSync(file, "utf8").split(/\r?\n/);
        if (lines.length <= 100) continue;
        const hasContents = lines.slice(0, 15).some((line) => /^## Contents\s*$/.test(line));
        assert.ok(
          hasContents,
          `${relative(ROOT, file)}: ${lines.length} lines and no "## Contents" in its first 15 lines`,
        );
      }
    });

    test("R5 references stay one level deep", () => {
      for (const file of references) {
        // A link back to SKILL.md adds no depth, so only links to other reference files fail.
        const nested = relativeLinks(readFileSync(file, "utf8"))
          .map((target) => resolve(dirname(file), target))
          .filter((target) => extname(target) === ".md" && target !== skillPath && target.startsWith(folder));
        assert.deepEqual(
          nested.map((target) => relative(ROOT, target)),
          [],
          `${relative(ROOT, file)}: links to another reference file`,
        );
      }
    });

    test("relative links resolve to existing files", () => {
      for (const file of markdown) {
        const broken = relativeLinks(readFileSync(file, "utf8")).filter(
          (target) => !existsSync(resolve(dirname(file), target)),
        );
        assert.deepEqual(broken, [], `${relative(ROOT, file)}: broken relative links`);
      }
    });

    test("R13 every bundled script is named in SKILL.md", () => {
      const scripts = files.filter((file) => SCRIPT_EXTENSIONS.has(extname(file)) && statSync(file).isFile());
      const unnamed = scripts.filter((file) => !skillText.includes(basename(file))).map((file) => relative(ROOT, file));
      assert.deepEqual(unnamed, [], `${name}/SKILL.md: does not name these scripts`);
    });

    test("R12 no backslash path segments", () => {
      for (const file of files) {
        const hit = readFileSync(file, "utf8").match(BACKSLASH_PATH);
        assert.equal(hit?.[0], undefined, `${relative(ROOT, file)}: backslash path "${hit?.[0]}"`);
      }
    });
  });
}

describe(OUTPUT_STYLES, () => {
  for (const file of readdirSync(join(ROOT, OUTPUT_STYLES))
    .filter((entry) => extname(entry) === ".md")
    .map((entry) => join(ROOT, OUTPUT_STYLES, entry))) {
    test(`${basename(file)} frontmatter has name and description`, () => {
      const { data } = parseFrontmatter(readFileSync(file, "utf8"));
      assert.ok(data.name, `${relative(ROOT, file)}: frontmatter has no name`);
      assert.ok(data.description, `${relative(ROOT, file)}: frontmatter has no description`);
    });
  }
});

// The plugin names no project layout: where docs and tests live is each repo's own CLAUDE.md.
describe("no prescribed layout", () => {
  const retiredDocs = /\b(?:product|architecture|examples|roadmap)\.md\b|outputty:(?:begin|end)/;
  const shipped = [
    ...["templates", "skills", "hooks", "output-styles"].flatMap((dir) => walk(join(ROOT, dir))),
    join(ROOT, "README.md"),
  ].filter((file) => extname(file) === ".md");

  test("no template, skill, standing line, style or README names a retired doc or the managed-block marker", () => {
    const hits = shipped
      .filter((file) => retiredDocs.test(readFileSync(file, "utf8")))
      .map((file) => relative(ROOT, file));
    assert.deepEqual(hits, [], "names a retired doc or marker");
  });

  test("the standing lines name no test or source folder", () => {
    const text = readFileSync(join(ROOT, "hooks/context.md"), "utf8");
    assert.doesNotMatch(text, /__tests__|\bsrc\//);
  });

  test("retro routes every correction to a lint rule or a CLAUDE.md line, and to nothing else", () => {
    const text = readFileSync(join(ROOT, "templates/skills/retro/SKILL.md"), "utf8");
    assert.match(text, /1\. \*\*A new lint rule\*\*/);
    assert.match(text, /2\. \*\*A lint rule that conflicts with the correction\*\*: delete it/);
    assert.match(text, /3\. \*\*A line in the repo's `CLAUDE\.md`\*\*/);
    assert.doesNotMatch(text, /lesson|\.claude\/rules|output-styles|settings\.json|reproduces/i);
  });

  test("the settings template denies reads of plan records", () => {
    const settings = JSON.parse(readFileSync(join(ROOT, "templates/settings.json"), "utf8"));
    assert.ok(settings.permissions.deny.includes("Read(./plans/**)"));
  });

  test("the settings template pins no advisorModel, so init's union leaves the user's own global one", () => {
    const settings = JSON.parse(readFileSync(join(ROOT, "templates/settings.json"), "utf8"));
    assert.equal("advisorModel" in settings, false);
  });

  test("init writes the board ids under This repo, the heading the tracker and retro skills read", () => {
    const init = readFileSync(join(ROOT, "skills/init/SKILL.md"), "utf8");
    assert.match(init, /under \*\*This repo\*\* in `CLAUDE\.md`/);
    assert.doesNotMatch(init, /under \*\*Tracker\*\*/);
  });

  test("init puts the scaffold and the drafted CLAUDE.md at the monorepo root, wherever it is run from", () => {
    const init = readFileSync(join(ROOT, "skills/init/SKILL.md"), "utf8");
    assert.match(
      init,
      /In a monorepo[^\n]*at the monorepo root \(`git rev-parse --show-toplevel`\), once, wherever init is run from/,
    );
  });

  test("init creates plans/ and a root .ignore entry for it", () => {
    const text = readFileSync(join(ROOT, "skills/init/SKILL.md"), "utf8");
    assert.match(text, /`plans\/`[\s\S]*\.ignore/);
  });

  test("plan writes its record only at go, and no other skill points at plans/", () => {
    const plan = readFileSync(join(ROOT, "templates/skills/plan/SKILL.md"), "utf8");
    assert.match(plan, /Edit no repo file and file no ticket until the user says go/);
    const pointers = shipped
      .filter((file) => !/templates\/skills\/plan\/|skills\/init\/|README\.md$|ISSUE_TEMPLATE/.test(file))
      .filter((file) => /plans\//.test(readFileSync(file, "utf8")))
      .map((file) => relative(ROOT, file));
    assert.deepEqual(pointers, [], "points at plans/");
  });

  test("no skill names a review mechanism other than the built-in /code-review", () => {
    const hits = skillFolders().filter((folder) => /review/i.test(basename(folder)));
    assert.deepEqual(hits, []);
    assert.equal(existsSync(join(ROOT, "templates/agents")), false);
    const herdr = readFileSync(join(ROOT, "templates/skills/herdr/SKILL.md"), "utf8");
    assert.doesNotMatch(herdr, /review/i);
  });
});

// A build stacks only on the user's opt-in: the `stack` label set at planning, never the size of the change.
describe("one PR per ticket by default", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");

  test("build picks no shape by the size of the change", () => {
    assert.doesNotMatch(read("templates/skills/build/SKILL.md"), /\d+\s+(?:or more\s+)?added lines/);
  });

  test("the default goal lines name no stack", () => {
    const goals = read("templates/skills/tickets/SKILL.md")
      .split("\n")
      .filter((line) => line.startsWith("/goal "));
    assert.ok(goals.length > 0, "tickets prints no /goal line");
    for (const goal of goals) assert.doesNotMatch(goal, /stack/i, goal);
  });

  test("plan sets the stack label on the user's yes, and the tracker creates it", () => {
    assert.match(read("templates/skills/plan/SKILL.md"), /Ask whether the build stacks/);
    const tracker = read("templates/skills/tracker/SKILL.md");
    assert.match(tracker, /gh label create stack /);
    assert.match(tracker, /gh issue create [^\n]*--label ready,stack/);
    assert.match(tracker, /gh issue edit <n> --add-label stack/);
  });
});

// A prototype is a cheap Haiku session in its own tab and worktree; its stubs are the build's to replace.
describe("prototype hands a local branch to plan and build", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");

  test("prototype writes tests first, stubs with an exact marker, and never pushes", () => {
    const prototype = read("templates/skills/prototype/SKILL.md");
    assert.match(prototype, /## 3\. Tests first[\s\S]*## 4\. Wire it/);
    assert.match(prototype, /`TODO: stub - /);
    assert.match(prototype, /never push, open a PR/);
  });

  test("build and prototype try a judgement call in parallel trial forks, and nothing else", () => {
    for (const path of ["templates/skills/build/SKILL.md", "templates/skills/prototype/SKILL.md"]) {
      assert.match(
        read(path),
        /one trial fork per [a-z]+ in parallel, each judged on one observable named beforehand/,
        path,
      );
      assert.match(read(path), /no judgement call; try nothing else/, path);
      assert.match(read(path), /start each fork with `isolation: "worktree"`/, path);
    }
  });

  test("herdr opens a prototype in its own worktree on Haiku", () => {
    assert.match(read("templates/skills/herdr/SKILL.md"), /--worktree proto-<n or slug> --model haiku/);
  });

  test("build continues the prototype branch and finishes only with no stub left", () => {
    const build = read("templates/skills/build/SKILL.md");
    assert.match(build, /from the prototype when the ticket has one/);
    assert.match(build, /every case passes and the `tracker` skill's stub list prints nothing/);
    assert.match(
      read("templates/skills/tracker/SKILL.md"),
      /git diff origin\/main\.\.\.HEAD \| grep '\^\+\.\*TODO: stub'/,
    );
  });
});

// A spike is one test case, and a change runs the tests it affects.
describe("spikes and test runs stay small", () => {
  test("the standing lines keep a spike to one test case, and a test run to what the change affects", () => {
    const text = readFileSync(join(ROOT, "hooks/context.md"), "utf8");
    assert.match(text, /Spike only an assumption that reading cannot settle: write one test case/);
    assert.match(text, /Run only the tests the change affects, never the full suite or the full gate for one PR/);
    assert.doesNotMatch(text, /Run a spike as a fork/);
  });

  test("planning lists both levels by reading, and spikes nothing else", () => {
    const plan = readFileSync(join(ROOT, "templates/skills/plan/SKILL.md"), "utf8");
    assert.match(plan, /1\. Read the place in hand/);
    assert.match(plan, /2\. Read one level up/);
    assert.match(plan, /Nothing else in a planning session is spiked/);
  });
});

// The plugin, not init, supplies its lines and its style, so an upgrade reaches every session.
// Spec: https://code.claude.com/docs/en/hooks.md#sessionstart - plain stdout becomes context, capped at 10,000 characters.
describe("the plugin supplies its lines and style", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");

  test("the SessionStart hook prints hooks/context.md whole, under the 10,000-character cap", () => {
    const [entry] = JSON.parse(read("hooks/hooks.json")).hooks.SessionStart;
    const [hook] = entry.hooks;
    // Claude Code substitutes the plugin root inline in a hook's args before it runs the command.
    const args = hook.args.map((arg) => arg.replaceAll("${CLAUDE_PLUGIN_ROOT}", ROOT));
    const run = spawnSync(hook.command, args, { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, read("hooks/context.md"));
    assert.ok(run.stdout.length < 10_000, `the hook prints ${run.stdout.length} characters, at or over 10,000`);
  });

  test("the output style is forced while the plugin is enabled, and keeps the coding instructions", () => {
    const { data } = parseFrontmatter(read("output-styles/outputty.md"));
    assert.equal(data["force-for-plugin"], "true");
    assert.equal(data["keep-coding-instructions"], "true");
  });

  test("the standing lines let CLAUDE.md win, and hold no personal toolset or line a single skill owns", () => {
    const text = read("hooks/context.md");
    assert.match(text, /CLAUDE\.md wins where it disagrees/);
    assert.doesNotMatch(text, /Prefer bun/);
    assert.doesNotMatch(text, /gate at construction|Gate a feature/i);
    assert.doesNotMatch(text, /latest `main`/);
    assert.doesNotMatch(text, /linter's config/);
  });

  test("init merges and copies nothing the plugin supplies, and removes what an older init merged", () => {
    const init = read("skills/init/SKILL.md");
    assert.doesNotMatch(init, /Merge `[^`]*(?:context|CLAUDE\.user)\.md`/);
    assert.doesNotMatch(init, /→ `~\/\.claude\/output-styles/);
    assert.doesNotMatch(init, /Set `"outputStyle"/);
    assert.match(init, /gate a feature at construction[^\n]*latest `main`[^\n]*linter's config before prose/);
    assert.match(init, /Keep the user's own Tools line, and every other line of the user's own/);
    assert.match(init, /`~\/\.claude\/output-styles\/outputty\.md`, and the `"outputStyle": "outputty"` key/);
  });

  test("the lines one skill needs live in that skill", () => {
    assert.match(read("templates/skills/build/SKILL.md"), /Otherwise gate at construction: the orchestrator passes/);
    assert.match(read("templates/skills/herdr/SKILL.md"), /Create every worktree from the latest `main`/);
    assert.match(
      read("templates/skills/build/SKILL.md"),
      /Delete the docstring of each unit an edit changes before making the edit[^\n]*cut what the search does not find/,
    );
    assert.doesNotMatch(read("hooks/context.md"), /docstring that changes/);
  });
});

// The code rules live in one file that the build skill writes by and the audit skill checks against.
describe("the code rules have one home, and the audit covers all of them", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");
  const audit = read("templates/skills/audit/SKILL.md");
  const build = read("templates/skills/build/SKILL.md");

  test("the audit names every heading of the code rules", () => {
    const headings = [...read("templates/rules/code.md").matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    assert.ok(headings.includes("Fits in your head"), "the code rules lost their headings");
    const missing = headings.filter((heading) => !audit.includes(`**${heading}**`));
    assert.deepEqual(missing, [], "a code rule heading the audit does not cover");
  });

  test("the audit assumes nothing, edits nothing and leaves the plan to the user", () => {
    assert.match(audit, /recorded as a question, never as a finding/);
    assert.match(audit, /The audit edits nothing and files nothing/);
    assert.match(audit, /how the plan is actioned is the user's to say/);
    assert.match(audit, /nothing that depends on it enters the plan/);
  });

  test("build and audit point at the code rules and restate none", () => {
    for (const skill of [build, audit]) assert.match(skill, /`~\/\.claude\/rules\/code\.md`/);
    assert.doesNotMatch(build, /^## (Packages|Classes|Fits in your head|Names|Docstrings)$/m);
    assert.doesNotMatch(audit, /at most seven paths/);
  });

  test("the code rules load in every session and name no one language's syntax as the rule", () => {
    const rules = read("templates/rules/code.md");
    assert.doesNotMatch(rules, /^---\npaths:/, "a paths filter would stop the code rules loading at launch");
    assert.doesNotMatch(rules, /TypeScript assertion function|per step \d|the ticket/);
    assert.match(rules, /Explore code through the `LSP` tool first/);
    assert.doesNotMatch(read("templates/rules/typescript.md"), /Explore code through the `LSP` tool/);
  });
});
