// Every skill and output style follows the skill rubric: each check names the rubric rule it enforces.
// Spec: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
// and https://code.claude.com/docs/en/skills
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, extname, basename } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SKILL_ROOTS = ["templates/skills", "skills"];
const OUTPUT_STYLES = "templates/output-styles";
const DOC_TEMPLATES = "templates/docs";
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

/**
 * Lists a markdown text's `##` headings other than Contents, in order.
 * `## Contents\n## Next\n## Later` → [`Next`, `Later`]
 */
function sectionHeadings(text) {
  return [...text.matchAll(/^## (.+?)\s*$/gm)].map((match) => match[1]).filter((heading) => heading !== "Contents");
}

/**
 * Lists the bullets of a text's `## Contents` section, each cut at its ` - ` description.
 * `## Contents\n\n- Next - why now\n\n## Next` → [`Next`]
 */
function contentsEntries(text) {
  const section = text.match(/^## Contents\s*\n([\s\S]*?)(?=^## )/m)?.[1] ?? "";
  return [...section.matchAll(/^- (.+?)(?: - .*)?$/gm)].map((match) => match[1]);
}

// The product docs grow past 100 lines in a real repo and are read whole by plan and build,
// so each template ships the contents list a partial read depends on.
describe(DOC_TEMPLATES, () => {
  for (const file of readdirSync(join(ROOT, DOC_TEMPLATES))
    .filter((entry) => extname(entry) === ".md")
    .map((entry) => join(ROOT, DOC_TEMPLATES, entry))) {
    test(`R4 ${basename(file)} opens with a ## Contents list matching its headings`, () => {
      const text = readFileSync(file, "utf8");
      const where = relative(ROOT, file);
      const opensWithContents = text
        .split(/\r?\n/)
        .slice(0, 15)
        .some((line) => /^## Contents\s*$/.test(line));
      assert.ok(opensWithContents, `${where}: no "## Contents" in its first 15 lines`);
      assert.deepEqual(
        contentsEntries(text),
        sectionHeadings(text),
        `${where}: Contents does not match its ## headings`,
      );
    });
  }
});

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
