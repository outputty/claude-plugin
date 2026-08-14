#!/usr/bin/env bun
// Tests for role detection and the orchestrator write boundary. Both run against REAL git repos - a
// primary checkout and a linked worktree - because the whole distinction is a git fact
// (`--git-dir` differs from `--git-common-dir` only in a linked worktree). Stubbing git would test a
// different mechanism from the one that ships.
const assert = require("node:assert");
const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { detectRole } = require("./lib.js");
const BOUNDARY_HOOK = path.join(import.meta.dir, "write-boundary.js");

/**
 * A primary checkout plus a linked worktree of it.
 * @returns {{primary: string, linked: string, cleanup: () => void}} both paths and a disposer.
 */
function repos() {
  const primary = fs.mkdtempSync(path.join(os.tmpdir(), "role-primary-"));
  const git = (args, cwd = primary) => execSync(`git ${args}`, { cwd, stdio: ["ignore", "pipe", "ignore"] });
  git("init -q");
  git("config user.email t@t.t");
  git("config user.name t");
  fs.writeFileSync(path.join(primary, "f.txt"), "x\n");
  git("add -A");
  git("commit -qm base");
  const linked = path.join(os.tmpdir(), `role-linked-${process.pid}-${primary.slice(-6)}`);
  git(`worktree add -q -b item ${linked}`);
  return {
    primary,
    linked,
    cleanup: () => {
      fs.rmSync(linked, { recursive: true, force: true });
      fs.rmSync(primary, { recursive: true, force: true });
    },
  };
}

const { primary, linked, cleanup } = repos();

// The three roles. Only HERDR_ENV plus the worktree fact decides; nothing is configured or declared.
{
  assert.strictEqual(detectRole(primary, { HERDR_ENV: "1" }), "orchestrator", "primary under herdr orchestrates");
  assert.strictEqual(detectRole(linked, { HERDR_ENV: "1" }), "item", "a linked worktree runs the item");
  assert.strictEqual(detectRole(primary, {}), "plain", "no herdr means the plain flow");
  assert.strictEqual(detectRole(linked, {}), "plain", "a worktree without herdr is still just the flow");
}

/**
 * Run the write-boundary hook against one edit.
 * @param {string} file - the path being edited.
 * @param {string} cwd - the repo to run in.
 * @param {object} env - environment overrides.
 * @returns {boolean} whether the edit was denied.
 */
function denied(file, cwd, env = { HERDR_ENV: "1" }) {
  const res = spawnSync("node", [BOUNDARY_HOOK], {
    input: JSON.stringify({ cwd, tool_name: "Edit", tool_input: { file_path: file } }),
    encoding: "utf8",
    env: { ...process.env, ...env, CLAUDE_PROJECT_DIR: cwd },
  });
  return res.stdout.includes('"deny"');
}

// The orchestrator's allowlist: planning and documentation only.
{
  assert(!denied(".claude/roadmap.yaml", primary), "the roadmap is the orchestrator's to curate");
  assert(!denied("README.md", primary), "the README is documentation");
  assert(!denied("docs/security.md", primary), "docs/ is documentation");
  assert(denied("skills/outputty/tasks.md", primary), "an instruction file is behaviour, not documentation");
  assert(denied("hooks/session.js", primary), "code is never edited on main");
}

// The carve-out inside the allowlist: a trail belongs to the session that grilled it. The trail now
// carries the task graph in its `tasks:` section, so this one deny covers SPEC's rulings and PLAN's
// graph together.
{
  assert(denied(".claude/trails/feature-x.trail.yaml", primary), "authoring a trail here rebuilds SPEC-on-main");
  assert(denied(".claude/trails/0001-bootstrap.trail.yaml", primary), "every file under trails/ is the item's");
}

// Every other role is untouched: the item session must be able to edit code, which is its whole job.
{
  assert(!denied("hooks/session.js", linked), "the item session edits code freely");
  assert(!denied("hooks/session.js", primary, {}), "without herdr there is no orchestrator to bound");
}

cleanup();
console.log("role detection + write boundary: all checks passed");
