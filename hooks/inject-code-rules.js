#!/usr/bin/env node
/**
 * inject-code-rules.js — the code rules load the moment code gets written, once per session.
 *
 * PreToolUse on Edit|Write|NotebookEdit, MAIN SESSION ONLY — code-writing subagents preload the same
 * rules via their charters' `skills:` field, so a subagent payload (agent_id present) exits silently
 * here rather than double-delivering.
 *
 * Why this exists: the code rules used to ride the SessionStart injection, so every session paid
 * ~510 words whether or not it ever wrote code. Injecting on the first edit delivers them exactly when
 * they apply. The sentinel in code-rules.md keeps it to one injection per transcript: once the
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

// Subagents preload the rules via their charter — this hook is the main session's delivery only.
if (input.agent_id || input.agent_type) process.exit(0);

// Already injected in this transcript? Stay silent. An unreadable transcript injects (a duplicate
// costs a little context; a session editing code with no rules costs a defect).
try {
  if (fs.readFileSync(input.transcript_path, "utf8").includes(SENTINEL)) process.exit(0);
} catch {
  /* inject */
}

let rules;
try {
  rules = fs.readFileSync(path.join(__dirname, "..", "skills", "code-rules", "SKILL.md"), "utf8");
  rules = rules.split("---").slice(2).join("---").trim(); // frontmatter off — context, not a skill listing
} catch {
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: rules },
  }),
);
process.exit(0);
