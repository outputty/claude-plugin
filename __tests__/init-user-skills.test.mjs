// Init's user-skill copy runs end to end against a scratch directory, never the real ~/.claude.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SYNC = join(ROOT, "skills/init/scripts/sync-template.sh");
const COMPOSE = join(ROOT, "skills/eval/scripts/compose.sh");
const ONBOARD = join(ROOT, "skills/init/scripts/onboard-skill.sh");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function git(repo, ...args) {
  return run("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args]);
}

function scratch() {
  return mkdtempSync(join(tmpdir(), "outputty-init-"));
}

function writeTemplate(dir, text) {
  mkdirSync(join(dir, "plan"), { recursive: true });
  writeFileSync(join(dir, "plan/SKILL.md"), "---\nname: plan\n---\n" + text + "\n");
}

describe("init copies the user skills into ~/.claude/skills as a git repo", () => {
  test("the repo tracks only outputty-*, keeps the user's copy, and offers a template change", () => {
    const home = scratch();
    const templates = join(home, "templates");
    const repo = join(home, "skills");
    writeTemplate(templates, "step one");
    mkdirSync(join(repo, "synced"), { recursive: true });
    writeFileSync(join(repo, "synced/manifest.json"), "{}");

    run("bash", [SYNC, "skills", templates, repo, "0.180.0"]);
    assert.equal(git(repo, "ls-files"), ".gitignore\noutputty-plan/SKILL.md");
    assert.match(git(repo, "branch", "--format=%(refname:short)"), /template/);

    writeFileSync(join(repo, "outputty-plan/SKILL.md"), "---\nname: plan\n---\nmy own step\n");
    git(repo, "commit", "-qam", "user edit");
    writeTemplate(templates, "step two");
    const branchBefore = git(repo, "symbolic-ref", "HEAD");
    const offers = run("bash", [SYNC, "skills", templates, repo, "0.181.0"]);

    assert.match(offers, /^\+step two$/m);
    assert.equal(readFileSync(join(repo, "outputty-plan/SKILL.md"), "utf8"), "---\nname: plan\n---\nmy own step\n");
    assert.equal(git(repo, "symbolic-ref", "HEAD"), branchBefore);
    assert.equal(git(repo, "status", "--porcelain"), "");
  });

  test("a rules folder keeps outputty-code.md and nothing else", () => {
    const home = scratch();
    const templates = join(home, "rules-src");
    const repo = join(home, "rules");
    mkdirSync(templates);
    writeFileSync(join(templates, "code.md"), "# Code\n");
    mkdirSync(repo);
    writeFileSync(join(repo, "mine.md"), "# mine\n");

    run("bash", [SYNC, "rules", templates, repo, "0.180.0"]);
    assert.equal(git(repo, "ls-files"), ".gitignore\noutputty-code.md");
  });

  test("onboarding renames a skill and adds the name it had as a folder", () => {
    const skills = scratch();
    mkdirSync(join(skills, "deploy-check"));
    writeFileSync(join(skills, "deploy-check/SKILL.md"), "---\ndescription: checks a deploy\n---\nbody\n");

    run("bash", [ONBOARD, skills, "deploy-check"]);
    assert.equal(existsSync(join(skills, "deploy-check")), false);
    assert.equal(
      readFileSync(join(skills, "outputty-deploy-check/SKILL.md"), "utf8"),
      "---\ndescription: checks a deploy\nname: deploy-check\n---\nbody\n",
    );
  });

  test("compose.sh builds one plugin from the plugin skills, the user's skills and rules, and their cases", () => {
    const home = scratch();
    const skills = join(home, "skills");
    const rules = join(home, "rules");
    const out = join(home, "composed");
    run("bash", [SYNC, "skills", join(ROOT, "templates/skills"), skills, "0.180.0"]);
    run("bash", [SYNC, "rules", join(ROOT, "templates/rules"), rules, "0.180.0"]);

    run("bash", [COMPOSE, skills, rules, out]);

    for (const name of ["outputty-plan", "outputty-build", "init", "eval", "herdr"])
      assert.ok(existsSync(join(out, "skills", name, "SKILL.md")), name + " is not in the composed plugin");
    assert.ok(existsSync(join(out, "evals/skills/trigger/plan/prompt.md")));
    assert.ok(existsSync(join(out, "evals/skills/split/bun/prompt.md")));
    assert.ok(existsSync(join(out, "evals/skills/trigger/herdr/prompt.md")));
    const hook = JSON.parse(readFileSync(join(out, "hooks/hooks.json"), "utf8"));
    assert.deepEqual(hook.hooks.SessionStart[0].hooks[0].args, [
      "${CLAUDE_PLUGIN_ROOT}/hooks/context.md",
      "${CLAUDE_PLUGIN_ROOT}/templates/rules/outputty-code.md",
      "${CLAUDE_PLUGIN_ROOT}/templates/rules/outputty-typescript.md",
    ]);
    assert.equal(JSON.parse(readFileSync(join(out, ".claude-plugin/plugin.json"), "utf8")).name, "outputty");
  });

  test("onboarding refuses a skill with no frontmatter and leaves its folder alone", () => {
    const skills = scratch();
    mkdirSync(join(skills, "notes"));
    writeFileSync(join(skills, "notes/SKILL.md"), "body only\n");

    const result = spawnSync("bash", [ONBOARD, skills, "notes"], { encoding: "utf8" });

    assert.notEqual(result.status, 0);
    assert.ok(existsSync(join(skills, "notes/SKILL.md")));
  });
});
