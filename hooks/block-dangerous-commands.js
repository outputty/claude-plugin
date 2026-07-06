#!/usr/bin/env node
// outputty PreToolUse hook (Bash matcher): deny destructive commands, ask on push-to-main.
// Ported from a production data-integrations hook; rewritten in Node for the correct Claude Code
// PreToolUse schema and cross-platform use (no bash/python3 dependency). Matters most because
// outputty's BUILD phase runs shell autonomously and unattended.
const fs = require("fs");

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

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch (e) {
  out("allow");
}
const cmd = (input.tool_input && input.tool_input.command) || "";
if (!cmd) out("allow");

// [regex, decision, reason]
const checks = [
  [/git\s+push\s+.*--force(?!-with-lease)/, "deny", "Force push without --force-with-lease"],
  [/git\s+reset\s+--hard/, "deny", "Hard reset is destructive"],
  [/git\s+clean\s+-f/, "deny", "git clean -f removes untracked files"],
  [/rm\s+-rf\s+\/(\s|$|\*)/, "deny", "Recursive delete of root filesystem"],
  [/chmod\s+777/, "deny", "World-writable permissions"],
  [/(curl|wget)\s+.*\|\s*(sudo\s+)?bash/, "deny", "Piped remote execution"],
  [/\bDROP\s+(TABLE|DATABASE)\b/i, "deny", "DROP TABLE/DATABASE"],
  [/\bDELETE\s+FROM\b(?![\s\S]*\bWHERE\b)/i, "deny", "DELETE FROM without WHERE"],
  [/git\s+push\s+\S*\s*(main|master)\b/, "ask", "Push directly to main/master"],
];
for (const [re, decision, reason] of checks) {
  if (re.test(cmd)) out(decision, reason);
}
out("allow");
