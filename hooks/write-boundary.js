#!/usr/bin/env node
// outputty PreToolUse hook (Edit|Write matcher): the orchestrator session edits planning and
// documentation only. Every other role exits silently.
//
// No NotebookEdit matcher on purpose. 1,622 transcripts contain 0 NotebookEdit calls, and the two
// secret hooks both return SILENT on a NotebookEdit payload because neither reads `notebook_path`.
// A matcher token that is dead at both ends is not inherited.
//
// A path outside the repository is not this hook's concern - the boundary exists so the primary
// checkout's own code is edited in an item workspace, not on main.
const path = require("path");
const { readHookInput, detectRole, git } = require("./lib.js");

// `.claude/trails/**` is denied inside an otherwise allowed `.claude/**`. The trail and the task
// graph are the item's own artifacts; letting the orchestrator write them rebuilds SPEC and PLAN
// on main, which this split exists to remove.
const ALLOWED = [/^\.claude\//, /^docs\//, /^README\.md$/];
const DENIED_INSIDE_ALLOWED = [/^\.claude\/trails\//];

const BOUNDARY =
  "The orchestrator edits planning and documentation only: `.claude/**` (except `.claude/trails/**`), " +
  "`docs/**`, `README.md`.";

/**
 * Emit a PreToolUse deny and stop.
 * @param {string} reason - what the agent must do instead.
 * @returns {void}
 */
function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

const input = readHookInput();
const cwd = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
if (detectRole(cwd, process.env) !== "orchestrator") process.exit(0);

const target = input.tool_input && input.tool_input.file_path;
if (!target) process.exit(0);

const root = git(cwd, "rev-parse --show-toplevel") || cwd;
const rel = path.relative(root, path.resolve(root, target));
if (rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);

if (DENIED_INSIDE_ALLOWED.some((re) => re.test(rel))) {
  deny(
    `${BOUNDARY} A trail and its task graph are written in the item's own session, where SPEC and PLAN run. ` +
      "Dispatch the item instead.",
  );
}
if (!ALLOWED.some((re) => re.test(rel))) {
  deny(`${BOUNDARY} Code changes belong to an item workspace - dispatch one.`);
}
process.exit(0);
