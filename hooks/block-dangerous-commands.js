#!/usr/bin/env node
// outputty PreToolUse hook (Bash matcher): deny destructive commands, ask on risky-but-valid ones.
// Rewritten in Node for the correct Claude Code PreToolUse schema and cross-platform use.
// A heuristic deny/ask nudge for an autonomous BUILD phase — not a hard security boundary
// (it can be defeated by quoting/env indirection); it fails toward MORE denials, never fewer.
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

// SQL destructive writes: scan PER STATEMENT so a later WHERE or a trailing statement can't mask an
// earlier destructive one. Over-splitting a string literal only makes this more conservative.
for (const stmt of cmd.split(";")) {
  if (/\bDROP\s+(TABLE|DATABASE)\b/i.test(stmt)) out("deny", "DROP TABLE/DATABASE");
  if (/\bTRUNCATE\s+TABLE\b/i.test(stmt)) out("deny", "TRUNCATE TABLE");
  if (/\bDELETE\s+FROM\b/i.test(stmt) && !/\bWHERE\b/i.test(stmt)) out("deny", "DELETE FROM without WHERE");
}

// [regex, decision, reason] — evaluated in order, FIRST MATCH WINS.
// The --force-with-lease allow must precede the force deny (it contains the substring "--force"),
// and the push-to-main ask must stay LAST so a force-push-to-main denies rather than merely asks.
const checks = [
  [/git\s+push\b.*--force-with-lease/, "allow", "force-with-lease is safe"],
  [/git\s+push\b.*(--force\b|\s-\w*f\b|\s\+\S)/, "deny", "Force push (or +refspec) without --force-with-lease"],
  [/git\s+reset\s+--hard/, "deny", "Hard reset is destructive"],
  [/git\s+clean\s+(--force\b|-[a-z]*f)/, "deny", "git clean force removes untracked files"],
  [/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r)\s+\/(?!\S*\/\S)/i, "deny", "Recursive delete of a root-level path"],
  [/chmod\s+777/, "deny", "World-writable permissions"],
  [/(curl|wget)\s+.*\|\s*(sudo\s+)?bash/, "deny", "Piped remote execution"],
  [/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r)\b/i, "ask", "Recursive force delete"],
  [/git\s+push\s+\S*\s*(main|master)\b/, "ask", "Push directly to main/master"],
];
for (const [re, decision, reason] of checks) {
  if (re.test(cmd)) out(decision, reason);
}
out("allow");
