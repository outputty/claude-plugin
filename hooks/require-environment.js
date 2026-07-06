#!/usr/bin/env node
// outputty PreToolUse hook (Edit|Write matcher): DENY real work (file mutations) unless the tools are
// present. This is the ENFORCED counterpart to session.js's advisory warning - PreToolUse can deny;
// SessionStart cannot. Read-only tools (Read/Grep/Glob) are never matched, so browsing/answering in
// any repo stays free. Checks the CHEAP structural preconditions per edit: a git repo (resolved via
// `git rev-parse` so a subdirectory launch still finds the root) + OpenWolf (.wolf/ at that root).
// The expensive capability nuances (openwolf --version, gh auth, GitHub origin) are warned once at
// SessionStart and asserted by the flow when a feature actually starts.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function out(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        ...(reason ? { permissionDecisionReason: reason } : {}),
      },
    })
  );
  process.exit(0);
}

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let top = null;
try {
  top = execSync("git rev-parse --show-toplevel", { cwd: root, stdio: ["ignore", "pipe", "ignore"], timeout: 4000 })
    .toString()
    .trim();
} catch (e) {
  top = null;
}

const missing = [];
if (!top) missing.push("git (`git init`)");
if (!fs.existsSync(path.join(top || root, ".wolf"))) missing.push("OpenWolf (`openwolf init`)");

if (missing.length) {
  out(
    "deny",
    "outputty: real work needs " + missing.join(" + ") + " in this project. Set it up, or keep to read-only work."
  );
}
out("allow");
