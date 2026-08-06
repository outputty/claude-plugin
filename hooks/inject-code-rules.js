#!/usr/bin/env node
/**
 * inject-code-rules.js — the code rules load the moment code gets written, once per session.
 *
 * PreToolUse on Edit|Write|NotebookEdit (main session AND subagents — tool events fire for both).
 *
 * Why this exists: the code rules used to ride the SessionStart injection, so every session paid
 * ~510 words whether or not it ever wrote code — and subagents, which write most of the code, never
 * received them at all. Injecting on the first edit delivers them exactly when they apply, to exactly
 * whoever is editing. The sentinel in code-rules.md keeps it to one injection per transcript: once the
 * rules are in context, re-sending them every edit would be pure bloat.
 */

const fs = require("fs");
const path = require("path");

const SENTINEL = "outputty:code-rules";

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

// Already injected in this transcript? Stay silent. An unreadable transcript injects (a duplicate
// costs a little context; a session editing code with no rules costs a defect).
try {
  if (fs.readFileSync(input.transcript_path, "utf8").includes(SENTINEL)) process.exit(0);
} catch {
  /* inject */
}

let rules;
try {
  rules = fs.readFileSync(path.join(__dirname, "code-rules.md"), "utf8");
} catch {
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: rules },
  }),
);
process.exit(0);
