#!/usr/bin/env node
// outputty PreToolUse hook (Bash matcher): deny destructive commands, ask on risky-but-valid ones.
// A heuristic deny/ask nudge for an autonomous BUILD phase - not a hard security boundary; it fails
// toward MORE denials, never fewer. It NEVER emits an explicit `allow`: per the hooks docs, a silent
// exit 0 means "no decision, defer to the permission flow" and does not approve - so this guard can
// never auto-approve past a sibling guard on the same tool.
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
  process.exit(0); // abstain
}
const cmd = (input.tool_input && input.tool_input.command) || "";
if (!cmd) process.exit(0); // abstain

// SQL destructive writes: scan PER STATEMENT so a later WHERE or trailing statement can't mask one.
for (const stmt of cmd.split(";")) {
  if (/\bDROP\s+(TABLE|DATABASE)\b/i.test(stmt)) out("deny", "DROP TABLE/DATABASE");
  if (/\bTRUNCATE\s+TABLE\b/i.test(stmt)) out("deny", "TRUNCATE TABLE");
  // Check EACH delete separately (split at every DELETE FROM) so a WHERE on one delete can't mask an
  // unguarded delete sharing the same statement — e.g. two -c flags to a DB CLI, no semicolon.
  for (const d of stmt.split(/(?=\bDELETE\s+FROM\b)/i)) {
    if (/\bDELETE\s+FROM\b/i.test(d) && !/\bWHERE\b/i.test(d)) out("deny", "DELETE FROM without WHERE");
  }
}

// rm with BOTH a recursive flag AND a force flag (any order, short OR long form).
if (/\brm\b/i.test(cmd) && /(\s-[a-z]*r|--recursive)/i.test(cmd) && /(\s-[a-z]*f|--force)/i.test(cmd)) {
  if (/\s\/(\s|$)/.test(cmd) || /\s\/[^/\s]+(\s|$)/.test(cmd)) out("deny", "Recursive force delete of a root-level path");
  out("ask", "Recursive force delete");
}

// Force push: deny a bare --force / -f / +refspec. --force-with-lease is safe, so STRIP that token
// first, then test what remains - a command carrying BOTH --force-with-lease AND a bare --force still
// denies. (A dedicated block, not an array entry, so a "safe" match can never abstain other checks.)
const pushSeg = cmd.split(/&&|;|\|\|/).find((s) => /git\s+push\b/.test(s));
if (pushSeg) {
  const stripped = pushSeg.replace(/--force-with-lease(=\S*)?/g, " ");
  if (/(--force\b|\s-\w*f|\s\+\S)/.test(stripped)) out("deny", "Force push (or +refspec) without --force-with-lease");
}

// [regex, decision, reason] — first match wins.
const checks = [
  [/git\s+reset\s+--hard/, "deny", "Hard reset is destructive"],
  [/git\s+clean\b.*(--force\b|\s-[a-z]*f)/, "deny", "git clean force removes untracked files"],
  [/chmod\s+777/, "deny", "World-writable permissions"],
  [/(curl|wget)\s+.*\|\s*(sudo\s+)?bash/, "deny", "Piped remote execution"],
  [/git\s+push\s+\S*\s*(main|master)\b/, "ask", "Push directly to main/master"],
];
for (const [re, decision, reason] of checks) {
  if (re.test(cmd)) out(decision, reason);
}
process.exit(0); // no match: abstain
