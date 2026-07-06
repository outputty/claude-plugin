#!/usr/bin/env node
// outputty PreToolUse hook (Edit|Write matcher): scan written content for credential patterns.
// Returns "ask" (not "deny") so a human can override for legitimate cases like test fixtures.
// Stops an autonomous build agent from writing a leaked credential into a file it then commits.
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
  process.exit(0);
}
const inp = input.tool_input || {};
const text = inp.content || inp.new_string || "";
if (!text) process.exit(0);

// [regex, description]
const patterns = [
  [/AKIA[0-9A-Z]{16}/, "AWS Access Key ID"],
  [/(?<![\w-])sk_(?:live|test)_[a-zA-Z0-9]{16,}/, "Stripe secret key"],
  [/(?<![\w-])sk-(?:proj-)?[a-zA-Z0-9]{20,}/, "OpenAI secret key"],
  [/ghp_[a-zA-Z0-9]{36}/, "GitHub personal access token"],
  [/gho_[a-zA-Z0-9]{36}/, "GitHub OAuth token"],
  [/github_pat_[a-zA-Z0-9_]{82}/, "GitHub fine-grained PAT"],
  [/-----BEGIN[\s\S]*?PRIVATE KEY-----/, "Private key block"],
  [/:\/\/[^:@\s]+:[^@\s]+@/, "Connection string with embedded password"],
];
for (const [re, desc] of patterns) {
  if (re.test(text)) out("ask", `Possible credential detected: ${desc}`);
}
process.exit(0);
