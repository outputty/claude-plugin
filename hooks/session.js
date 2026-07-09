#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically. Injects context only (a
// SessionStart hook cannot deny tool calls); REAL work is enforced by the require-environment
// PreToolUse guard. All prose lives in sibling .md files. On a subagent, OR when capabilities are
// missing, the protocol is NOT injected.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * Read a sibling file (next to this hook) as UTF-8 text.
 * @param {string} name - file name, e.g. "protocol.md".
 * @returns {string} the file's contents.
 */
const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

/**
 * Whether this SessionStart is firing inside a subagent rather than the main session. A subagent's
 * hook input carries agent_id/agent_type; scoped micro-agents don't need the protocol. Missing or
 * invalid stdin is treated as the main session.
 * @returns {boolean} true if a subagent.
 */
function isSubagent() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
    return Boolean(input.agent_id || input.agent_type);
  } catch (e) {
    return false;
  }
}

/**
 * Run a git command in the project root.
 * @param {string} args - the git arguments, e.g. "remote".
 * @returns {string|null} trimmed stdout, or null on any failure.
 */
function git(args) {
  try {
    return execSync("git " + args, { cwd: root, stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).toString().trim();
  } catch (e) {
    return null;
  }
}

/**
 * Run a command for its exit status only. A transient timeout must not read as a real negative.
 * @param {string} cmd - the command to run.
 * @returns {"ok"|"fail"|"timeout"} the outcome.
 */
function runs(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "ignore", timeout: 5000, killSignal: "SIGKILL" });
    return "ok";
  } catch (e) {
    return e.code === "ETIMEDOUT" || e.signal === "SIGTERM" || e.signal === "SIGKILL" ? "timeout" : "fail";
  }
}

/**
 * The single OpenWolf problem to report, checked first-to-last via guard clauses.
 * @returns {string|null} the problem, or null when OpenWolf is ready.
 */
function openWolfProblem() {
  if (!fs.existsSync(path.join(root, ".wolf"))) return "OpenWolf not initialised - run `openwolf init`";
  if (runs("openwolf --version") !== "ok") return "`openwolf` CLI not runnable - install it / add to PATH";
  return null;
}

/**
 * Git/GitHub problems to report. A later check is meaningless once its prerequisite is absent, so
 * return early with just that one problem.
 * @returns {string[]} zero or more problems.
 */
function gitProblems() {
  if (git("rev-parse --is-inside-work-tree") !== "true") return ["not a git repository - run `git init`"];
  if (!git("remote")) return ["no git remote - run `git remote add origin <url>`"];
  const problems = [];
  if (runs("gh auth status") === "fail") problems.push("`gh` not authenticated - run `gh auth login`");
  const origin = git("remote get-url origin") || "";
  if (origin && !/github\.com|git@github/i.test(origin)) problems.push("`origin` is not a GitHub remote");
  return problems;
}

/**
 * Every missing capability (warn about these; the session is never blocked here).
 * @returns {string[]} zero or more missing-capability messages.
 */
function missingCapabilities() {
  const missing = [];
  const openWolf = openWolfProblem();
  if (openWolf) missing.push(openWolf);
  missing.push(...gitProblems());
  return missing;
}

/**
 * Render the environment-incomplete warning from its template, filling in the missing list.
 * @param {string[]} missing - the missing-capability messages (non-empty).
 * @returns {string} the rendered warning markdown.
 */
function warning(missing) {
  return read("env-incomplete.md").replace("{{missing}}", missing.map((m) => "  - " + m).join("\n"));
}

// Sequence: subagents get nothing; an incomplete environment gets ONLY the warning and stops (the
// protocol is not loaded); otherwise inject the protocol.
if (isSubagent()) process.exit(0);
const missing = missingCapabilities();
if (missing.length) {
  process.stdout.write(warning(missing));
  process.exit(0);
}
process.stdout.write(read("protocol.md"));
