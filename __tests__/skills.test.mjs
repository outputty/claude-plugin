// Every skill and output style follows the skill rubric: each check names the rubric rule it enforces.
// Spec: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
// and https://code.claude.com/docs/en/skills
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, extname, basename } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SKILL_ROOTS = ["skills", "templates/skills"];
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
 * `skills` → [`<root>/skills/build`, ...]
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

  test("dream sends every friction to a user skill, a rule file, a CLAUDE.md line or a lint rule, and keeps an edit only when it measured better", () => {
    const text = readFileSync(join(ROOT, "skills/dream/SKILL.md"), "utf8");
    assert.match(text, /a user skill in `~\/\.claude\/skills`; a rule file in `~\/\.claude\/rules`/);
    assert.match(text, /a repo `CLAUDE\.md` line or lint rule on `dream\/<date>` with a PR/);
    assert.match(text, /beats the base beyond the noise and no existing case drops below the base/);
    assert.match(text, /Commit `Dream-Through: <ISO>`/);
    assert.equal(existsSync(join(ROOT, "skills/retro")), false);
  });

  test("plan records stay writable: the settings template denies nothing under plans/, and init removes the deny an older init added", () => {
    const settings = JSON.parse(readFileSync(join(ROOT, "templates/settings.json"), "utf8"));
    assert.equal(
      settings.permissions.deny.some((rule) => rule.includes("plans/")),
      false,
    );
    assert.match(
      readFileSync(join(ROOT, "skills/init/SKILL.md"), "utf8"),
      /Remove `"Read\(\.\/plans\/\*\*\)"` from `permissions\.deny`/,
    );
  });

  test("the settings template pins no advisorModel, so init's union leaves the user's own global one", () => {
    const settings = JSON.parse(readFileSync(join(ROOT, "templates/settings.json"), "utf8"));
    assert.equal("advisorModel" in settings, false);
  });

  test("init writes the board ids under This repo, the heading the tracker skill reads", () => {
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
      .filter((file) => !/skills\/plan\/|skills\/init\/|README\.md$|ISSUE_TEMPLATE/.test(file))
      // The session folder `~/.claude/projects/<project>/plans/` is outside the repo, so it is no pointer.
      .filter((file) => /(?<!<project>\/)plans\//.test(readFileSync(file, "utf8")))
      .map((file) => relative(ROOT, file));
    assert.deepEqual(pointers, [], "points at plans/");
  });

  test("no skill names a review mechanism other than the built-in /code-review", () => {
    const hits = skillFolders().filter((folder) => /review/i.test(basename(folder)));
    assert.deepEqual(hits, []);
    assert.equal(existsSync(join(ROOT, "templates/agents")), false);
    const herdr = readFileSync(join(ROOT, "skills/herdr/SKILL.md"), "utf8");
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
    const goals = read("templates/skills/tickets/references/goal-lines.md")
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
describe("prototype hands a published branch to plan and build", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");

  test("prototype writes tests first, stubs with an exact marker, and opens no PR", () => {
    const prototype = read("templates/skills/prototype/SKILL.md");
    assert.match(prototype, /Write the tests first[\s\S]*Wire it/);
    assert.match(prototype, /`TODO: stub - /);
    assert.match(prototype, /Don't open a PR, or edit a ticket body beyond its \*\*Base\*\* line/);
  });

  test("build and prototype try a judgement call only on the user's yes, one fork at a time per the style", () => {
    for (const path of ["templates/skills/build/SKILL.md", "templates/skills/prototype/SKILL.md"]) {
      assert.match(
        read(path),
        /offer a trial\. On the user's yes, run one trial fork per [a-z]+, each judged on that observable/,
        path,
      );
      assert.doesNotMatch(read(path), /trial fork per [a-z]+ in parallel/, path);
      assert.match(read(path), /no judgement call; try nothing else/, path);
      assert.match(read(path), /start each fork with `isolation: "worktree"`/, path);
    }
    assert.match(
      read("output-styles/outputty.md"),
      /Run at most one subagent or fork at a time that runs tests, builds or edits/,
    );
  });

  test("herdr opens a prototype in its own worktree on Haiku", () => {
    assert.match(read("skills/herdr/SKILL.md"), /--worktree proto-<n or slug> --model haiku/);
  });

  test("a build keeps moving: it parks a ticket on a question, asks the advisor before the one criteria run, and reads each run in one call", () => {
    const build = read("templates/skills/build/SKILL.md");
    assert.match(
      build,
      /post it as a ticket comment, commit and push the work so far, park the ticket, and build the next unblocked ticket/,
    );
    assert.ok(
      build.indexOf("Call `advisor` on the finished diff") < build.indexOf("Run every Implementation-criteria case"),
      "the advisor runs after the criteria",
    );
    assert.match(build, /format check, lint and typecheck commands/);
    const hook = read("hooks/context.md");
    assert.match(hook, /read its summary in the same call/);
    assert.doesNotMatch(hook, /read the file in a separate call/);
    assert.match(
      read("output-styles/outputty.md"),
      /at most one subagent or fork at a time that runs tests, builds or edits/,
    );
  });

  test("a question during a build loop opens a forked ask tab and the build keeps building", () => {
    const build = read("templates/skills/build/SKILL.md");
    assert.match(build, /opens a side tab and the build keeps building/);
    assert.match(build, /Answering in tab \(ask\) <n>/);
    assert.match(
      build,
      /On "stop working and answer", commit what is on disk, stop, answer in this tab, and end each stop-hook turn with no text until the user says to resume/,
    );
    assert.match(build, /Re-read the ticket's comments and apply each ruling/);
    const herdr = read("skills/herdr/SKILL.md");
    assert.match(herdr, /\*\*Ask\*\*[^\n]*--resume <build session id> --fork-session/);
    assert.match(herdr, /the Ask case forks a session in its own worktree and skips this step/);
  });

  test("build and plan carry the example rule: run what exists, list the end state for a future design", () => {
    for (const path of ["templates/skills/build/SKILL.md", "templates/skills/plan/SKILL.md"]) {
      const skill = read(path);
      assert.match(skill, /for behaviour that exists or is being built and can be run reliably, run it/);
      assert.match(skill, /list the end state first, then write the example from that list as if all of it exists/);
      assert.match(skill, /read no code, run no spike and name no internals/);
    }
  });

  test("build starts from the ticket's Base and finishes only with no stub left", () => {
    const build = read("templates/skills/build/SKILL.md");
    assert.match(build, /Start the build branch from the ticket's \*\*Base\*\*/);
    assert.match(build, /every case passes and the `tracker` skill's stub list prints nothing/);
    assert.match(
      read("templates/skills/tracker/SKILL.md"),
      /git diff origin\/main\.\.\.HEAD \| grep '\^\+\.\*TODO: stub'/,
    );
  });
});

// A spike is one test case, and a change runs the tests it affects.
describe("spikes and test runs stay small", () => {
  test("the standing lines run a spike only on the user's ask, as one test case, and a test run only over what the change affects", () => {
    const text = readFileSync(join(ROOT, "hooks/context.md"), "utf8");
    assert.match(text, /Run a spike only when the user asks for one: write one test case/);
    assert.match(text, /Run only the test files the change affects, never a script that runs them all/);
    assert.doesNotMatch(text, /Run a spike as a fork/);
  });

  test("a fast-path fix hands its build to a build tab, and a build asks the advisor after a failed fix", () => {
    const plan = readFileSync(join(ROOT, "templates/skills/plan/SKILL.md"), "utf8");
    assert.match(plan, /then open the ticket's build tab per the `herdr` skill's Build case/);
    assert.doesNotMatch(plan, /follow the `build` skill from its claim step in this session/);
    const build = readFileSync(join(ROOT, "templates/skills/build/SKILL.md"), "utf8");
    assert.match(build, /Call `advisor` when a fix fails, before the next attempt/);
  });

  test("planning lists both levels by reading, and leaves the spike rule to the standing lines", () => {
    const plan = readFileSync(join(ROOT, "templates/skills/plan/SKILL.md"), "utf8");
    assert.match(plan, /Read the place in hand/);
    assert.ok(plan.indexOf("Read the place in hand") < plan.indexOf("Read one level up"));
    assert.doesNotMatch(plan, /Don't run a spike unless the user asks for one/);
  });

  test("planning runs the XY check before the first round and on every workaround, and always lists refusing the case", () => {
    const plan = readFileSync(join(ROOT, "templates/skills/plan/SKILL.md"), "utf8");
    assert.match(plan, /Run the \*\*XY check\*\* first; its branches are the tree's first decision/);
    assert.match(
      plan,
      /again on any decision that works around a constraint an earlier ticket, plan record or session set/,
    );
    assert.match(
      plan,
      /Refuse the case: a hard requirement rejects the input behind the constraint.*List this branch every time/,
    );
    assert.match(plan, /On the user's "build it now", run the \*\*XY check\*\*/);
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

  test("nothing reported is trusted unchecked: each ticket and each agent result carries how to validate it, and this session filters", () => {
    const style = read("output-styles/outputty.md");
    assert.match(
      style,
      /Treat earlier context, tool results, tickets and other agents as possibly wrong: check against the source/,
    );
    assert.match(style, /return every number or finding with how to validate it/);
    assert.match(style, /This session is the source of truth for every agent and session it runs/);
    assert.match(style, /When a result stays inconclusive after validation, ask the user/);
    assert.match(style, /A skill that gives its report a shape uses that shape in place of the Recap/);
    for (const template of ["templates/ISSUE_TEMPLATE/task.md", ".github/ISSUE_TEMPLATE/task.md"]) {
      assert.match(
        read(template),
        /## Solution[\s\S]*### How to validate[\s\S]*inputs, and a flowchart of how to reach it[\s\S]*the exact script that measures it[\s\S]*## Attempted/,
        template,
      );
    }
    assert.match(
      read("templates/skills/plan/SKILL.md"),
      /When the interview gives no \*\*How to validate\*\*, work it out with the user/,
    );
  });

  test("no planning PR: a build starts from the ticket's Base, and a prototype branch is published for it", () => {
    for (const template of ["templates/ISSUE_TEMPLATE/task.md", ".github/ISSUE_TEMPLATE/task.md"]) {
      assert.match(
        read(template),
        /- Base: `main`, or `prototype\/<name>` - the branch on GitHub the build starts from\./,
        template,
      );
    }
    for (const skill of ["build", "plan", "prototype", "tickets", "tracker"]) {
      assert.doesNotMatch(
        read(`templates/skills/${skill}/SKILL.md`),
        /planning PR|planning branch|planning-branch/i,
        skill,
      );
    }
    const tracker = read("templates/skills/tracker/SKILL.md");
    assert.match(tracker, /git switch -c feature\/<slug>-<ticket#> origin\/<base>/);
    assert.match(tracker, /git push -u origin prototype\/<name>/);
    assert.match(read("templates/skills/build/SKILL.md"), /Start the build branch from the ticket's \*\*Base\*\*/);
    assert.match(read("templates/skills/prototype/SKILL.md"), /A ticket: set its \*\*Base\*\* to the branch/);
    assert.match(read("templates/skills/plan/SKILL.md"), /Post the plan record on the ticket as one comment/);
  });

  test("a ticket states the problem and the end state, and leaves how to build it to the build", () => {
    for (const template of ["templates/ISSUE_TEMPLATE/task.md", ".github/ISSUE_TEMPLATE/task.md"]) {
      const ticket = read(template);
      assert.match(
        ticket,
        /## Problem[\s\S]*or the test that shows it, by path and test name[\s\S]*## Assumptions/,
        template,
      );
      assert.match(
        ticket,
        /## Solution\n\n<The end state, not how to build it:[^>]*the call the user writes[^>]*No file, symbol, seam or internal step\.>/,
        template,
      );
      assert.doesNotMatch(ticket, /Sibling|Where:|Grade|seam planning picked|construction site/, template);
      assert.match(ticket, /- Review effort: `high`, or `low` for a small, self-contained ticket/, template);
    }
    const plan = read("templates/skills/plan/SKILL.md");
    assert.match(plan, /Name no file, symbol or seam; the build finds them\./);
    assert.doesNotMatch(plan, /production-grade|\*\*Grade\*\*|\*\*Where\*\*/);
    const build = read("templates/skills/build/SKILL.md");
    assert.match(build, /Find the \*\*Sibling\*\* and the seam, and read them\./);
    assert.doesNotMatch(build, /\*\*Grade\*\*|\*\*Where\*\*|Build the seam that the ticket/);
    assert.match(
      read("templates/skills/build/SKILL.md"),
      /When it has none, work one out with the user through `AskUserQuestion`, four per call, before the first edit/,
    );
  });

  test("a question round covers one spike or thread, which keeps its own plan file, and a picture comes only when needed", () => {
    const style = read("output-styles/outputty.md");
    assert.match(style, /One spike or thread per round, named at the start of the round/);
    assert.match(style, /the end-to-end example as the user would write it, and its output/);
    assert.match(style, /Give each spike, and each thread once two or more are open, its own plan file/);
    assert.match(
      style,
      /A picture, only when the example cannot show how two or more parts connect, or when the user asks for one/,
    );
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

  test("init copies each workflow skill from templates/skills to ~/.claude/skills/outputty-<name>/ and removes none", () => {
    const names = [
      "audit",
      "build",
      "documentation",
      "plan",
      "prototype",
      "research",
      "tickets",
      "tracker",
      "ts-pattern",
      "tsup",
      "typescript-node",
    ];
    const init = read("skills/init/SKILL.md");
    for (const name of names) {
      assert.ok(
        existsSync(join(ROOT, "templates/skills", name, "SKILL.md")),
        "templates/skills/" + name + " is missing",
      );
      assert.equal(existsSync(join(ROOT, "skills", name)), false, "skills/" + name + " still ships in the plugin");
    }
    assert.match(init, /sync-template\.sh skills \$\{CLAUDE_PLUGIN_ROOT\}\/templates\/skills ~\/\.claude\/skills/);
    assert.match(init, /onboard-skill\.sh ~\/\.claude\/skills <folder>/);
    assert.match(init, /Never remove a skill folder under `~\/\.claude\/skills\/`/);
    assert.doesNotMatch(init, /the plugin ships it as/);
  });

  test("the lines one skill needs live in that skill", () => {
    assert.match(read("templates/skills/build/SKILL.md"), /Otherwise gate at construction: the orchestrator passes/);
    const build = read("templates/skills/build/SKILL.md");
    assert.ok(
      build.indexOf("run the tests the change reaches after each change") <
        build.indexOf("Once the tests prove a change works, read the whole function it sits in and simplify it") &&
        build.indexOf("Once the tests prove a change works") <
          build.indexOf("Then read each caller of that function") &&
        build.indexOf("Then read each caller of that function") < build.indexOf("Commit each chunk with its test"),
      "after the tests prove a change, the build simplifies the whole function, then its callers, before the commit",
    );
    assert.match(build, /keep each step, a command or a query, to as few jobs as possible, ideally one/);
    assert.match(
      build,
      /When a change in the caller lets the function drop a check, a branch or a parameter, make the fix there instead/,
    );
    assert.match(read("skills/herdr/SKILL.md"), /Create every worktree from the latest `main`/);
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
    assert.ok(headings.includes("Names"), "the code rules lost their headings");
    const missing = headings.filter((heading) => !audit.includes(`**${heading}**`));
    assert.deepEqual(missing, [], "a code rule heading the audit does not cover");
  });

  test("the audit assumes nothing, edits nothing and leaves the plan to the user", () => {
    assert.match(audit, /is a question, never a finding/);
    assert.match(audit, /The audit edits nothing and files nothing/);
    assert.match(audit, /the user decides how the plan is actioned/);
    assert.match(audit, /nothing that depends on it enters the plan/);
  });

  test("a new capability is sugar first, then an extension, then a new primitive, and planning lists its shapes in that order", () => {
    assert.match(
      read("templates/rules/code.md"),
      /Add a capability as sugar over existing primitives, else extend one, else add a primitive/,
    );
    assert.match(read("templates/skills/plan/SKILL.md"), /in the order the code rules' \*\*Structure\*\* gives/);
  });

  test("a test reads as the code a user writes, holds its whole program, and ends in one stored snapshot", () => {
    const rules = read("templates/rules/code.md");
    assert.match(rules, /Test end to end through the public entry point against the real dependency/);
    assert.match(rules, /A test reads top to bottom as the user's whole program and its result/);
  });

  test("build and audit point at the code rules and restate none", () => {
    for (const skill of [build, audit]) assert.match(skill, /`~\/\.claude\/rules\/outputty-code\.md`/);
    assert.doesNotMatch(build, /^## (Packages|Names|Docstrings)$/m);
  });

  test("the code rules load in every session and name no one language's syntax as the rule", () => {
    const rules = read("templates/rules/code.md");
    assert.doesNotMatch(rules, /^---\npaths:/, "a paths filter would stop the code rules loading at launch");
    assert.doesNotMatch(rules, /TypeScript assertion function|per step \d|the ticket/);
    assert.match(rules, /Explore code through the `LSP` tool first/);
    assert.match(rules, /It is a deferred tool: load it with ToolSearch `select:LSP` before the first code lookup/);
    assert.match(
      read("output-styles/outputty.md"),
      /A brief for work that reads code tells the agent to load the `LSP` tool with ToolSearch `select:LSP`/,
    );
    assert.doesNotMatch(read("templates/rules/typescript.md"), /Explore code through the `LSP` tool/);
  });
});

// Every skill takes one shape: a domain skill lists Do and Don't by tool or topic, a procedure skill runs Steps.
describe("one shape for every skill", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");
  const proceduralSkills = [
    "audit",
    "build",
    "dream",
    "eval",
    "herdr",
    "init",
    "plan",
    "prototype",
    "research",
    "tickets",
  ];
  const glossaryTerms = {
    audit: ["standing lines", "probe", "reader agent", "Next"],
    build: [
      "layer",
      "seam",
      "Sibling",
      "Gating",
      "Review effort",
      "Base",
      "spike",
      "advisor",
      "build-story artifact",
      "observable",
      "park",
      "stop-hook turn",
      "not-built-yet doc",
      "L<k>",
      "stack",
    ],
    documentation: ["spine", "code-forward standard", "de-slop", "mannered filler"],
    eval: ["section", "case", "grader", "base", "candidate", "round", "noise"],
    herdr: ["Herdr", "workspace", "pane", "pick", "needs-planning handoff", "/goal"],
    init: ["standing lines", "scaffold", "tracker ids", "drift"],
    plan: ["spike", "seam", "round", "XY check", "Fast-path fix", "Attempted", "Base", "stack"],
    research: ["research session", "research document", "finding", "ultracode"],
    prototype: ["Sibling", "stub", "seam", "Base", "observable", "trial fork", "build-story artifact", "advisor"],
    dream: ["friction", "window", "marker", "base"],
    tickets: ["buildable", "tier", "pick", "goal line", "layer", "stack"],
    tracker: ["layer", "stub", "prototype branch", "Base", "stack", "buildable"],
    "typescript-node": [
      "phantom property",
      "accumulated registry type",
      "builder",
      "state field",
      "record a fact",
      "construct signature",
      "hot generic type",
      "checkers",
      "declaration-merged registry",
    ],
  };

  for (const folder of skillFolders()) {
    const name = basename(folder);
    const body = parseFrontmatter(readFileSync(join(folder, "SKILL.md"), "utf8")).body;
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

    test(name + ": a bare title, the Glossary last, no fenced block", () => {
      assert.equal(body.match(/^# (.+)$/m)?.[1], name);
      assert.equal(headings.at(-1), "Glossary");
      assert.doesNotMatch(body, /^\s*(```|~~~)/m, "a SKILL.md body holds a fenced block");
    });

    test(name + ": Do lines never open with Don't, and Don't lines do or say never", () => {
      const lines = body.split("\n");
      let section = "";
      for (const line of lines) {
        const heading = line.match(/^#{2,3} (Do|Don't)$/);
        if (heading) section = heading[1];
        else if (/^#{2,3} /.test(line)) section = "";
        if (!line.startsWith("- ")) continue;
        if (section === "Do") assert.doesNotMatch(line, /^- Don't/, line);
        if (section === "Don't") assert.match(line, /^- Don't/, line);
      }
    });

    test(name + ": every file under references/ is named by SKILL.md", () => {
      const skillText = readFileSync(join(folder, "SKILL.md"), "utf8");
      const unnamed = walk(folder)
        .filter((file) => file !== join(folder, "SKILL.md"))
        // A skill's evals/ folder holds its cases, which the skill text never names.
        .filter((file) => !relative(folder, file).startsWith("evals/"))
        .filter((file) => !skillText.includes(relative(folder, file)))
        .map((file) => relative(ROOT, file));
      assert.deepEqual(unnamed, []);
    });

    test(name + ": every AskUserQuestion line reads four per call", () => {
      for (const line of body.split("\n").filter((line) => line.includes("AskUserQuestion")))
        assert.match(line, /four per call/, line);
    });

    test(name + ": the Glossary defines its terms", () => {
      const glossary = body.split("## Glossary")[1] ?? "";
      const defined = glossary.replaceAll("`", "").toLowerCase();
      for (const term of glossaryTerms[name] ?? [])
        assert.ok(defined.includes("**" + term.toLowerCase() + "**"), name + ": no Glossary line for " + term);
    });
  }

  test("a procedure skill has Steps made of checklist lines, and documentation has Validate instead", () => {
    for (const name of proceduralSkills) {
      const steps =
        readFileSync(
          join(
            skillFolders().find((folder) => basename(folder) === name),
            "SKILL.md",
          ),
          "utf8",
        )
          .split("\n## Steps")[1]
          ?.split("\n## ")[0] ?? "";
      assert.match(steps, /^- \[ \] 1\. /m, name + ": no checklist under ## Steps");
    }
    const documentation = read("templates/skills/documentation/SKILL.md");
    assert.doesNotMatch(documentation, /^## Steps$/m);
    assert.match(documentation.split("\n## Validate")[1].split("\n## ")[0], /^- \[ \] /m);
    for (const kind of ["tutorial", "how-to-guide", "reference", "explanation"]) {
      assert.match(documentation, new RegExp("^- .*\\[references/" + kind + "\\.md\\]", "m"), kind);
    }
  });

  test("a domain skill names no project's code or data, and the typescript snippets are one file each", () => {
    const hits = skillFolders().flatMap((folder) =>
      walk(folder)
        .filter((file) => /\.(md|ts|sql|txt|json)$/.test(file))
        .filter(
          (file) =>
            !file.includes("/chapters/") &&
            /\b(drain|Drained|lowercaseNames|DeepTech|ranges=Companies|Brand Name)\b|m\.query/.test(
              readFileSync(file, "utf8"),
            ),
        ),
    );
    assert.deepEqual(
      hits.map((file) => relative(ROOT, file)),
      [],
    );
    assert.equal(existsSync(join(ROOT, "templates/skills/typescript-node/references/fast-types.ts")), false);
  });

  test("the skill template shows both shapes, and init copies it", () => {
    const template = read("templates/skill-template.md");
    assert.match(template, /## The domain shape/);
    assert.match(template, /## The procedure shape/);
    assert.match(read("skills/init/SKILL.md"), /templates\/skill-template\.md` → `~\/\.claude\/skill-template\.md/);
    assert.match(read("CLAUDE.md"), /~\/\.claude\/skill-template\.md/);
  });
});

// A workflow skill reads the same way everywhere: its own procedures sit under Steps, never beside it.
describe("a workflow skill's top level is Steps, Do, Don't and Glossary", () => {
  for (const folder of skillFolders()) {
    const skill = basename(folder);
    const text = readFileSync(join(folder, "SKILL.md"), "utf8");
    if (!/^## Steps$/m.test(text)) continue;
    test(skill, () => {
      const headings = [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
      assert.deepEqual(headings, ["Steps", "Do", "Don't", "Glossary"]);
    });
  }
});

describe("plan checks the draft with the advisor before it files", () => {
  test("the advisor step comes after the user's yes to a draft and before the plan record and the ticket", () => {
    const plan = readFileSync(join(ROOT, "templates/skills/plan/SKILL.md"), "utf8");
    const at = (text) => plan.indexOf(text);

    assert.match(plan, /\n- \[ \] 12\. On the user's yes to the draft, call `advisor` before filing/);
    assert.ok(at("Size the work against one build") < at("call `advisor` before filing"));
    assert.ok(at("call `advisor` before filing") < at("On the user's go, file the ticket"));
    assert.match(plan, /smallest that fixes the root cause/);
  });
});

// The build follows the flow in the README: simplify, review, merge by rule, loop over what is buildable.
describe("the build flow: simplify before review, merge by rule, branch from an open PR, loop", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");
  const build = read("templates/skills/build/SKILL.md");

  test("/build simplifies before it runs /code-review, and the docs layer follows the review", () => {
    assert.ok(build.indexOf("simplify it before the review") < build.indexOf("invoke the built-in `/code-review`"));
    assert.ok(
      build.indexOf("invoke the built-in `/code-review`") < build.indexOf("Docs layer: use the `documentation` skill"),
    );
    assert.match(build, /complexity found in step 12/);
  });

  test("/build merges only when the Haiku classifier reports none of the three, or the user skipped manual review", () => {
    assert.match(build, /when the user said in this session to skip manual review/);
    assert.match(
      build,
      /start a Haiku agent briefed to read the whole PR diff and report three lines: a public API change, possibly breaking functionality, a major refactor/,
    );
    assert.match(
      build,
      /Merge only when all three read `none` and the merge does not deploy; any other report leaves the PR waiting for the user/,
    );
    assert.doesNotMatch(build, /Merge on the user's go-ahead/);
  });

  test("a ticket blocked by an open PR branches from that PR's branch and targets main, with no stack link", () => {
    assert.match(
      build,
      /start its build branch from that PR's branch, per the `tracker` skill, and target its PR at `main`; make no stack link/,
    );
    const tracker = read("templates/skills/tracker/SKILL.md");
    assert.match(tracker, /gh pr view <pr#> --json headRefName/);
    assert.match(tracker, /gh pr create --base main`, and never `gh stack link`/);
    assert.match(
      tracker,
      /\*\*Buildable\*\* - labelled `ready`, with no assignee and every blocker closed or held by an open PR/,
    );
  });

  test("a session on Fable calls no advisor in /build or /plan, and classification runs on Haiku", () => {
    assert.match(
      build,
      /On a session running on Fable, never call `advisor`: where a step calls it and a clean context adds value, start a general-purpose agent briefed for that task instead/,
    );
    assert.match(
      read("templates/skills/plan/SKILL.md"),
      /On a session running on Fable, start a general-purpose agent briefed with the same checks in place of the `advisor` call/,
    );
    assert.match(
      build,
      /Run a classification task, such as the merge classifier of step 19, on Haiku; run it on Sonnet only for a named exception/,
    );
  });

  test("/tickets prints the loop goal line, and no goal line carries a turn cap", () => {
    const lines = read("templates/skills/tickets/references/goal-lines.md");
    assert.match(
      lines,
      /^\/goal every buildable ticket is built by following \/build: each PR is open and ready for review, or merged when the merge rule allows; the goal ends when no open ticket is buildable or every one left is parked on a question$/m,
    );
    assert.doesNotMatch(lines, /stop after \d+ turns/);
    assert.match(
      read("templates/skills/tickets/SKILL.md"),
      /Print the goal line for the first buildable ticket and the loop goal line/,
    );
  });
});

// A research session, a loop build session and every Herdr session start the same way.
describe("herdr opens research and loop sessions, in bypass-permissions mode, with no turn cap", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");

  test("/research is a user skill with a Herdr case on Opus 5.5 started with --effort ultracode and ends in docs/research/<slug>.md", () => {
    const skill = read("templates/skills/research/SKILL.md");
    assert.match(
      skill,
      /Output: a reference document `docs\/research\/<slug>.md` in a PR the session opens, and no ticket/,
    );
    assert.match(skill, /Don't file a ticket or edit one/);
    assert.ok(existsSync(join(ROOT, "templates/skills/research/evals/trigger/prompt.md")));
    const herdr = read("skills/herdr/SKILL.md");
    assert.match(
      herdr,
      /\*\*Research\*\*: label `\(research\) <slug>`, name `research<slug>`, `-- --worktree research-<slug> --model claude-opus-5-5 --effort ultracode`; prompt: `\/research <topic>`/,
    );
    assert.match(
      herdr,
      /\*\*Build loop\*\*: label `\(build\) loop`, name `buildloop`, `-- --worktree build-loop --model sonnet`/,
    );
    assert.match(read("hooks/context.md"), /`\/plan`, `\/prototype`, `\/research` or `\/build` request/);
  });

  test("every Herdr session starts in bypass-permissions mode, and none carries a turn cap", () => {
    const herdr = read("skills/herdr/SKILL.md");
    assert.match(herdr, /--worktree <worktree> --permission-mode bypassPermissions <model flag>/);
    assert.match(herdr, /Pass `--permission-mode bypassPermissions` to every `herdr agent start`/);
    assert.doesNotMatch(herdr, /stop after \d+ turns/);
  });
});

// The README is the one doc: one flowchart, short paragraphs, and no pointer to a deleted doc.
describe("the README is the only doc", () => {
  const read = (path) => readFileSync(join(ROOT, path), "utf8");
  const deleted = [
    ".claude/product.md",
    ".claude/architecture.md",
    ".claude/examples.md",
    ".claude/roadmap.md",
    "docs/security.md",
  ];

  test("the five split docs are gone and nothing in the repo points at them", () => {
    for (const path of deleted) assert.equal(existsSync(join(ROOT, path)), false, path);
    const pointer = /\.claude\/(product|architecture|examples|roadmap)\.md|docs\/security\.md/;
    for (const path of ["README.md", "CLAUDE.md", "skills/init/SKILL.md", "hooks/context.md"]) {
      assert.doesNotMatch(read(path), pointer, path);
    }
  });

  test("the README holds the flow as its one flowchart, and no paragraph runs past three sentences", () => {
    const readme = read("README.md");
    const flowcharts = readme.match(/^```text\n[\s\S]*?-->[\s\S]*?^```$/gm) ?? [];
    assert.equal(flowcharts.length, 1);
    assert.match(flowcharts[0], /merge classifier clears the PR, or the user skipped manual review --> agent merges/);
    const prose = readme.replace(/^```[\s\S]*?^```$/gm, "").split("\n\n");
    for (const paragraph of prose) {
      if (/^(#|- |\d+\. )/.test(paragraph)) continue;
      const sentences = paragraph.split(/(?<=[.!?])\s+/).length;
      assert.ok(sentences <= 3, paragraph);
    }
  });
});
