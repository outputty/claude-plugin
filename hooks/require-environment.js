#!/usr/bin/env node
// outputty PreToolUse hook (Edit|Write matcher): DENY real work (file mutations) unless the tools are
// present. This is the ENFORCED counterpart to session.js's advisory warning - PreToolUse can deny;
// SessionStart cannot. Read-only tools (Read/Grep/Glob) are never matched, so browsing/answering in
// any repo stays free. Checks the ONE cheap structural precondition per edit: a git repo (resolved via
// `git rev-parse` so a subdirectory launch still finds the root) — the flow commits, branches and opens
// PRs, so without git it cannot work at all. The expensive capability nuances (gh auth, a GitHub origin)
// are warned once at SessionStart and asserted by the flow when a feature actually starts.
const { execSync } = require("child_process");

function out(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        ...(reason ? { permissionDecisionReason: reason } : {}),
      },
    }),
  );
  process.exit(0);
}

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let top = null;
try {
  top = execSync("git rev-parse --show-toplevel", { cwd: root, stdio: ["ignore", "pipe", "ignore"], timeout: 4000 })
    .toString()
    .trim();
} catch {
  top = null;
}

if (!top) {
  out("deny", "outputty: real work needs a git repo in this project (`git init`). Or keep to read-only work.");
}
process.exit(0);
