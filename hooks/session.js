#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically. Injects context only (a
// SessionStart hook cannot deny tool calls); REAL work is enforced by the require-environment
// PreToolUse guard. All prose lives in sibling .md files. A subagent gets nothing - its charter
// preloads the same rules through `skills:`.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { readHookInput, detectRole, git } = require("./lib.js");

// Everything below the sentinel in protocol.md applies to every role. Everything above it is the
// flow, which the orchestrator does not run.
const SHARED = "<!-- outputty:shared -->";

const input = readHookInput();
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

/**
 * Read a sibling file (next to this hook) as UTF-8 text.
 * @param {string} name - file name, e.g. "protocol.md".
 * @returns {string} the file's contents.
 */
const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

/**
 * The code rules, frontmatter stripped so they arrive as context rather than as a skill listing.
 * They ship with the protocol: a per-edit hook targeted them at the wrong files (16 of 20 fires
 * landed on .yaml/.md), and a session that edits code has already read past the first edit.
 * @returns {string} the rules markdown.
 */
const codeRules = () =>
  fs
    .readFileSync(path.join(__dirname, "..", "skills", "code-rules", "SKILL.md"), "utf8")
    .split("---")
    .slice(2)
    .join("---")
    .trim();

/**
 * protocol.md split at the sentinel. Fails loud: a missing sentinel would silently ship the
 * orchestrator an empty rule set.
 * @returns {{flow: string, shared: string}} the whole file without the sentinel, and the shared tail.
 */
function protocol() {
  const text = read("protocol.md");
  const at = text.indexOf(SHARED);
  if (at === -1) throw new Error(`hooks/protocol.md is missing its ${SHARED} sentinel`);
  return { flow: text.replace(SHARED + "\n", ""), shared: text.slice(at + SHARED.length).trim() };
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
 * Whether this SessionStart is firing inside a subagent rather than the main session. A subagent's
 * hook input carries agent_id/agent_type; scoped micro-agents don't need the protocol.
 * @param {object} hookInput - the already-parsed stdin.
 * @returns {boolean} true if a subagent.
 */
const isSubagent = (hookInput) => Boolean(hookInput.agent_id || hookInput.agent_type);

/**
 * Run a git command in the project root.
 * @param {string} args - the git arguments, e.g. "remote".
 * @returns {string|null} trimmed stdout, or null on any failure.
 */
const gitIn = (args) => git(root, args);

/**
 * Git/GitHub problems to warn about. A later check is meaningless once its prerequisite is absent,
 * so return early with just that one problem. These are WARNINGS ONLY - none of them may suppress
 * the injection below. A missing `gh stack` extension once deleted the whole protocol over a check
 * about stacking that most sessions never reach.
 * @returns {string[]} zero or more problems.
 */
function gitProblems() {
  if (gitIn("rev-parse --is-inside-work-tree") !== "true") return ["not a git repository - run `git init`"];
  if (!gitIn("remote")) return ["no git remote - run `git remote add origin <url>`"];
  const problems = [];
  if (runs("gh auth status") === "fail") problems.push("`gh` not authenticated - run `gh auth login`");
  const origin = gitIn("remote get-url origin") || "";
  if (origin && !/github\.com|git@github/i.test(origin)) problems.push("`origin` is not a GitHub remote");
  if (runs("gh stack --version") !== "ok")
    problems.push("`gh stack` extension missing - run `gh extension install github/gh-stack`");
  return problems;
}

/**
 * Render the environment-incomplete warning from its template, filling in the missing list.
 * @param {string[]} missing - the missing-capability messages (non-empty).
 * @returns {string} the rendered warning markdown.
 */
function warning(missing) {
  return read("env-incomplete.md").replace("{{missing}}", missing.map((m) => "  - " + m).join("\n"));
}

// Sequence: subagents get nothing; an incomplete environment gets the warning AND the protocol;
// the orchestrator gets its own charter plus the shared rules; every other role gets the flow.
if (isSubagent(input)) process.exit(0);

const missing = gitProblems();
if (missing.length) process.stdout.write(warning(missing) + "\n\n");

const { flow, shared } = protocol();
if (detectRole(root, process.env) === "orchestrator") {
  process.stdout.write(read("orchestrator.md") + "\n\n" + shared + "\n");
} else {
  process.stdout.write(flow);
  process.stdout.write("\n\n" + codeRules() + "\n");
}
