// Shared helpers for outputty's hooks. Kept here so session.js and write-boundary.js resolve the
// session's role the same way; two copies would drift and the boundary would deny what the protocol
// allows.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Read and parse the hook's stdin EXACTLY ONCE. fd 0 is a stream: a second read returns "", which
 * parses to {} and silently hands every caller `undefined` for every field. Call this once per
 * process and pass the result around.
 * @returns {object} the parsed hook input, or {} when stdin is empty or invalid.
 */
function readHookInput() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

/**
 * Run a git command and return its trimmed stdout.
 * @param {string} cwd - the directory to run in.
 * @param {string} args - the git arguments, e.g. "rev-parse --git-dir".
 * @returns {string|null} trimmed stdout, or null on any failure.
 */
function git(cwd, args) {
  try {
    return execSync("git " + args, { cwd, stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/**
 * Whether Herdr started this session. The orchestration split exists only under Herdr; without it
 * the session runs the flow itself.
 * @param {object} env - the environment, normally process.env.
 * @returns {boolean} true when HERDR_ENV is set to anything but "" or "0".
 */
function underHerdr(env) {
  const value = env.HERDR_ENV;
  return Boolean(value) && value !== "0";
}

/**
 * The session's role, resolved mechanically. No new flag: `git rev-parse --git-dir` and
 * `--git-common-dir` return the same path in a primary checkout and different paths in a linked
 * worktree, which is exactly the orchestrator/item split (spiked 2026-08-13).
 * @param {string} cwd - the session's working directory.
 * @param {object} env - the environment, normally process.env.
 * @returns {"orchestrator"|"item"|"plain"} the role.
 */
function detectRole(cwd, env) {
  if (!underHerdr(env)) return "plain";
  const dir = git(cwd, "rev-parse --git-dir");
  const common = git(cwd, "rev-parse --git-common-dir");
  if (!dir || !common) return "plain";
  return path.resolve(cwd, dir) === path.resolve(cwd, common) ? "orchestrator" : "item";
}

module.exports = { readHookInput, git, underHerdr, detectRole };
