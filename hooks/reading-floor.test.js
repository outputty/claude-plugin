#!/usr/bin/env bun
// Tests for the reading-floor hook. Runs the real hook as a child process against synthetic stdin, in a
// throwaway git repo with a real merge base — the hook's whole job depends on `git diff --name-only`
// answering, so stubbing git would test something the hook never does.
const assert = require("node:assert");
const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HOOK = path.join(import.meta.dir, "reading-floor.js");
const AGENT = "outputty:outputty-master-qa";

/**
 * Build a throwaway repo with one committed file, an `origin/main` to be the merge base, and one
 * changed file on top.
 * @returns {string} the repo path.
 */
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reading-floor-"));
  const git = (args) => execSync(`git ${args}`, { cwd: dir, stdio: ["ignore", "pipe", "ignore"] });
  git("init -q");
  git("config user.email t@t.t");
  git("config user.name t");
  fs.writeFileSync(path.join(dir, "changed.js"), "before\n");
  fs.writeFileSync(path.join(dir, "untouched.js"), "same\n");
  git("add -A");
  git("commit -qm base");
  git("branch -f origin/main"); // a local ref named origin/main is what merge-base resolves
  fs.writeFileSync(path.join(dir, "changed.js"), "after\n");
  git("add -A");
  git("commit -qm change");
  return dir;
}

/**
 * Run the hook against one payload.
 * @param {object} payload - the hook input.
 * @param {string} cwd - repo to run in.
 * @returns {{denied: boolean, reason: string}} what the hook decided.
 */
function run(payload, cwd) {
  const res = spawnSync("node", [HOOK], { input: JSON.stringify({ cwd, ...payload }), encoding: "utf8" });
  if (!res.stdout.trim()) return { denied: false, reason: "" };
  const out = JSON.parse(res.stdout).hookSpecificOutput;
  return { denied: out.permissionDecision === "deny", reason: out.permissionDecisionReason || "" };
}

const dir = repo();

// A windowed Bash read of a file in the diff is the core case.
{
  const r = run({ agent_type: AGENT, tool_name: "Bash", tool_input: { command: "sed -n '1,20p' changed.js" } }, dir);
  assert(r.denied, "sed -n on a changed file must be denied");
  assert(r.reason.includes("changed.js"), "the reason names the file");
  assert(r.reason.includes("whole"), "the reason restates the floor");
}

// Same command, a file that is NOT in the diff: untouched, because reaching outside the changed set is
// the legitimate half of the job.
{
  const r = run({ agent_type: AGENT, tool_name: "Bash", tool_input: { command: "sed -n '1,20p' untouched.js" } }, dir);
  assert(!r.denied, "a file outside the diff is never the hook's business");
}

// A directory-wide grep names no changed file and must survive: "who else calls this?" is real work.
{
  const r = run({ agent_type: AGENT, tool_name: "Bash", tool_input: { command: "rg -n 'someSymbol' ." } }, dir);
  assert(!r.denied, "a repo-wide sweep is not a fragment read");
}

// Grep aimed INSIDE a changed file is a fragment fetch wearing a search.
{
  const r = run({ agent_type: AGENT, tool_name: "Bash", tool_input: { command: "rg -n 'after' changed.js" } }, dir);
  assert(r.denied, "grepping inside a changed file must be denied");
}

// The Read tool windows through offset/limit — the leak a Bash-only floor would miss.
{
  const w = run(
    { agent_type: AGENT, tool_name: "Read", tool_input: { file_path: "changed.js", offset: 5, limit: 10 } },
    dir,
  );
  assert(w.denied, "a windowed Read of a changed file must be denied");
  const whole = run({ agent_type: AGENT, tool_name: "Read", tool_input: { file_path: "changed.js" } }, dir);
  assert(!whole.denied, "a WHOLE Read of a changed file is exactly what the floor asks for");
}

// The Grep tool with an explicit changed-file path, vs a directory.
{
  const file = run({ agent_type: AGENT, tool_name: "Grep", tool_input: { pattern: "x", path: "changed.js" } }, dir);
  assert(file.denied, "Grep tool aimed at a changed file must be denied");
  const dirwide = run({ agent_type: AGENT, tool_name: "Grep", tool_input: { pattern: "x", path: "." } }, dir);
  assert(!dirwide.denied, "Grep tool aimed at a directory must pass");
}

// Scope: every other agent and the main session are none of this hook's business.
{
  const other = run(
    { agent_type: "outputty:outputty-scout", tool_name: "Bash", tool_input: { command: "sed -n '1,5p' changed.js" } },
    dir,
  );
  assert(!other.denied, "another agent is not held to master QA's floor");
  const main = run({ tool_name: "Bash", tool_input: { command: "sed -n '1,5p' changed.js" } }, dir);
  assert(!main.denied, "the main session is not held to master QA's floor");
}

// Outside a git repo the changed set is unknowable, and a reading aid must never be why a review stalls.
{
  const nogit = fs.mkdtempSync(path.join(os.tmpdir(), "reading-floor-nogit-"));
  const r = run({ agent_type: AGENT, tool_name: "Bash", tool_input: { command: "sed -n '1,5p' changed.js" } }, nogit);
  assert(!r.denied, "no git answer means no opinion, never a block");
  fs.rmSync(nogit, { recursive: true, force: true });
}

fs.rmSync(dir, { recursive: true, force: true });
console.log("reading-floor.js: all checks passed");
