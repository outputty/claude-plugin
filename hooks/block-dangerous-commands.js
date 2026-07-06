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

// rm with BOTH a recursive flag AND a force flag (any order, short OR long form) — catches what the
// first-token flag-cluster regexes miss (`rm --recursive --force`, `rm -r ... -f`). Deny a root-level
// absolute target, ask otherwise.
if (/\brm\b/i.test(cmd) && /(\s-[a-z]*r|--recursive)/i.test(cmd) && /(\s-[a-z]*f|--force)/i.test(cmd)) {
  if (/\s\/(\s|$)/.test(cmd) || /\s\/[^/\s]+(\s|$)/.test(cmd)) out("deny", "Recursive force delete of a root-level path");
  out("ask", "Recursive force delete");
}

// [regex, decision, reason] — evaluated in order, FIRST MATCH WINS.
// The --force-with-lease allow must precede the force deny (it contains the substring "--force"),
// and the push-to-main ask must stay LAST so a force-push-to-main denies rather than merely asks.
const checks = [
  [/git\s+push\b.*--force-with-lease/, "allow", "force-with-lease is safe"],
  [/git\s+push\b.*(--force\b|\s-\w*f|\s\+\S)/, "deny", "Force push (or +refspec) without --force-with-lease"],
  [/git\s+reset\s+--hard/, "deny", "Hard reset is destructive"],
  [/git\s+clean\b.*(--force\b|\s-[a-z]*f)/, "deny", "git clean force removes untracked files"],
  [/chmod\s+777/, "deny", "World-writable permissions"],
  [/(curl|wget)\s+.*\|\s*(sudo\s+)?bash/, "deny", "Piped remote execution"],
  [/git\s+push\s+\S*\s*(main|master)\b/, "ask", "Push directly to main/master"],
];
for (const [re, decision, reason] of checks) {
  if (re.test(cmd)) out(decision, reason);
}
out("allow");
