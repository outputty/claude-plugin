#!/usr/bin/env node
/**
 * inject-subagent-protocol.js — every subagent receives the shared working rules.
 *
 * SubagentStart, all agent types. Emits `subagent-protocol.md` as additionalContext.
 *
 * Why this exists: session.js deliberately injects the main protocol only into the main session, so
 * for months subagents ran with no protocol at all — measured cost: 3 LSP calls against 19,902 Bash
 * calls across a real project, because "navigate with the LSP" never reached the agents doing the
 * navigating. Charters can't fix that alone: rules shared by every agent restated per charter drift
 * apart (measured: the LSP rule existed in 5 separate files). One file, injected at spawn, is the
 * single source those restatements collapse into.
 */

const fs = require("fs");
const path = require("path");

// The payload (agent_id/agent_type) is irrelevant: every agent gets the same rules, so stdin is
// deliberately not read — there is nothing to branch on.

let rules;
try {
  rules = fs.readFileSync(path.join(__dirname, "subagent-protocol.md"), "utf8");
} catch {
  // Missing file must not break every subagent spawn — but say so, don't fail silent.
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext:
          "outputty: subagent-protocol.md is missing from the plugin install — working rules were not injected.",
      },
    }),
  );
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "SubagentStart", additionalContext: rules },
  }),
);
process.exit(0);
