#!/usr/bin/env node
// outputty PreToolUse hook (Bash|Grep|Read matcher): hold master QA to its reading floor.
//
// Master QA's charter says to read each changed file WHOLE. Measured across three real runs it did the
// opposite: 8-10 whole-file reads against 44-63 fragment fetches. The cause was not defiance. The
// orchestrator's freehand dispatch brief carried "query, never read whole" verbatim in 3 of 3 runs, and
// a brief outranks a charter because it is the only user turn a subagent sees. Prose lost to prose, so
// this is the mechanism: the floor is restated at the moment it is crossed, where no brief can outrank it.
//
// The floor: three git calls and N whole-file Reads, where N is the number of changed files. Reaching
// OUTSIDE the changed set is legitimate work (who else calls this? is this solved elsewhere?), so a
// directory-wide grep is never denied. Only a fragment read of a file that is IN the diff is.
//
// Scoped to `outputty:outputty-master-qa` alone. Every other agent, and the main session, exits silently.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const AGENT = "outputty:outputty-master-qa";

/**
 * Emit a PreToolUse deny with a reason, then exit.
 *
 * Deny rather than warn: the plugin's measured record is that an injected nudge reads as one more piece
 * of advice, while a denial arrives at the moment of the act and cannot be skimmed past.
 * @param {string} reason - shown to the agent in place of the tool result.
 * @returns {void}
 */
function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    }),
  );
  process.exit(0);
}

/**
 * The files this build changed, relative to the merge base with the default branch.
 *
 * Recomputed per invocation on purpose: shell state does not persist between Bash tool calls, so there
 * is nothing to cache into. A failure here (no git, no origin/main, a detached checkout) returns an
 * empty set, which makes every check below a no-op — a reading aid must never be why a review stalls.
 * @param {string} cwd - the directory to run git in.
 * @returns {Set<string>} repo-relative paths, empty when git cannot answer.
 */
function changedFiles(cwd) {
  try {
    const base = execSync("git merge-base origin/main HEAD", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    })
      .toString()
      .trim();
    const out = execSync(`git diff --name-only ${base}...HEAD`, {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).toString();
    return new Set(out.split("\n").filter(Boolean));
  } catch {
    return new Set();
  }
}

/**
 * Whether a path names a file in the changed set.
 *
 * Compares by basename as well as full path: a command may address a file relatively, absolutely, or
 * from a subdirectory, and all three are the same file to the reviewer.
 * @param {string} candidate - a path pulled out of a command or tool input.
 * @param {Set<string>} changed - the changed set.
 * @returns {string|null} the matching changed-set path, or null.
 */
function inDiff(candidate, changed) {
  if (!candidate) return null;
  const clean = candidate.replace(/^['"]|['"]$/g, "");
  for (const file of changed) {
    if (clean === file || clean.endsWith("/" + file) || path.basename(clean) === path.basename(file)) return file;
  }
  return null;
}

const FLOOR =
  "The floor for this review is three git calls and N whole-file Reads, one per changed file. " +
  "Issue them in parallel batches rather than one per turn. `Grep` and `LSP` are for reaching " +
  "OUTSIDE the changed set (who else calls this, is this already solved elsewhere) and stay available " +
  "for that. Cross-layer drift exists only between whole files, so fragments structurally cannot show " +
  "it to you.";

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

if (input.agent_type !== AGENT) process.exit(0);

const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ti = input.tool_input || {};
const changed = changedFiles(cwd);
if (!changed.size) process.exit(0);

// The `Read` tool windows through `offset`/`limit`. Measured: 36 windowed reads across 7 master-QA runs
// went through Read, so a Bash-and-Grep-only floor leaks through the one tool the charter sanctions.
if (input.tool_name === "Read" && (ti.offset !== undefined || ti.limit !== undefined)) {
  const hit = inDiff(ti.file_path, changed);
  if (hit) {
    deny(`\`${hit}\` is in this build's diff, and this Read is windowed (offset/limit). Read it whole. ${FLOOR}`);
  }
  process.exit(0);
}

// The Grep tool aimed at a single changed file is a fragment fetch wearing a search. Aimed at a
// directory it is the legitimate reach-outside case, so only an explicit file target is denied.
if (input.tool_name === "Grep") {
  const target = ti.path || ti.glob;
  const hit = target && !target.includes("*") ? inDiff(target, changed) : null;
  if (hit) {
    deny(`\`${hit}\` is in this build's diff. Read it whole rather than grepping inside it. ${FLOOR}`);
  }
  process.exit(0);
}

// Bash: the window commands, plus grep/rg pointed at a changed file. A command naming no changed file
// passes untouched, which keeps every git call, every test run and every directory sweep working.
if (input.tool_name === "Bash") {
  const command = typeof ti.command === "string" ? ti.command : "";
  if (!command) process.exit(0);

  const WINDOW = /(^|[|;&]\s*)(sed\s+-n|head\b|tail\b|cat\b|awk\b)/;
  const SEARCH = /(^|[|;&]\s*)(rg|grep|egrep|fgrep)\b/;
  const isWindow = WINDOW.test(command);
  const isSearch = SEARCH.test(command);
  if (!isWindow && !isSearch) process.exit(0);

  // A search that names no path at all is a repo-wide sweep; only an explicit changed-file argument counts.
  for (const token of command.split(/\s+/)) {
    if (token.startsWith("-")) continue;
    const hit = inDiff(token, changed);
    if (!hit) continue;
    if (isWindow) {
      deny(`\`${hit}\` is in this build's diff and this command reads a window of it. Read it whole. ${FLOOR}`);
    }
    deny(
      `\`${hit}\` is in this build's diff. Searching inside a changed file returns a fragment; ` +
        `read it whole instead. ${FLOOR}`,
    );
  }
}

process.exit(0);
