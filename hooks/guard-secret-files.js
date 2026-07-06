#!/usr/bin/env node
// outputty PreToolUse hook (Read|Edit|Write matcher): deny touching secret files by path.
// The path-based counterpart to scan-secrets.js: that stops writing a secret VALUE; this stops
// reading/writing a secret FILE (.env, *.pem, *.key, secrets/, credentials.json) at all.
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
const inp = input.tool_input || {};
const fp = (inp.file_path || inp.path || "").replace(/\\/g, "/");
if (!fp) out("allow");

const deny = [
  /(^|\/)\.env($|\.)/, // .env, .env.local, ...
  /(^|\/)secrets\//,
  /\.pem$/,
  /\.key$/,
  /(^|\/)credentials\.json$/,
];
for (const re of deny) {
  if (re.test(fp)) out("deny", `Secret file access blocked: ${fp}`);
}
out("allow");
