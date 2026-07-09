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
    }),
  );
  process.exit(0);
}

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}
const inp = input.tool_input || {};
const fp = (inp.file_path || inp.path || "").replace(/\\/g, "/");
if (!fp) process.exit(0);

// Non-secret templates are meant to be committed and read during setup — allow them, but keep a
// disguised real secret (e.g. `.env.example.bak`) denied by anchoring the suffix with `$`.
if (/(^|\/)\.env\.(example|sample|template|dist)$/i.test(fp)) process.exit(0);

const deny = [
  /(^|\/)\.env($|\.)/i, // .env, .env.local, ... (case-insensitive: .ENV on Windows/macOS)
  /(^|\/)secrets\//i,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)credentials\.json$/i,
];
for (const re of deny) {
  if (re.test(fp)) out("deny", `Secret file access blocked: ${fp}`);
}
process.exit(0);
