#!/usr/bin/env node
/**
 * require-grill.js — the task graph cannot be written in a session that never loaded the grill skill.
 *
 * PreToolUse on Write/Edit. Fires only for `.claude/trails/<branch>.tasks.jsonl` — PLAN's single
 * output, and the moment planning stops being a conversation and becomes a commitment.
 *
 * Why this exists: `spec.md` used to say "use the `grill` skill's technique", which is a paraphrase,
 * not a load. Measured over 24 days of a real project, the skill was invoked 7 times and never during
 * the stretch that produced the worst plans — while SPEC documents were committed throughout. A phase
 * whose engine is prose runs without its engine, and nothing reports an error. This hook is the error.
 */

const fs = require("fs");

/**
 * Report whether this session ever loaded the grill skill.
 *
 * Counts two forms as a load: a `Read` of the skill file, or a `Skill` invocation naming grill. Reads
 * the transcript rather than any state we keep, so it cannot drift from what actually happened.
 *
 * @param {string} transcriptPath - JSONL transcript for the current session.
 * @returns {boolean|null} true/false when the transcript is readable, `null` when it is not.
 *
 * `loadedGrill("/…/abcd.jsonl")` -> true when the session ran `Skill(grill)`.
 */
function loadedGrill(transcriptPath) {
  if (!transcriptPath) return null;
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  return /skills\/grill\/SKILL\.md|"skill"\s*:\s*"[^"]*grill/.test(raw);
}

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath = (input.tool_input && input.tool_input.file_path) || "";
if (!/\.claude\/trails\/.*\.tasks\.jsonl$/.test(filePath)) process.exit(0);

const loaded = loadedGrill(input.transcript_path);

if (loaded === null) {
  // Cannot verify — say so rather than pretend the gate ran. Allowing an unverifiable case is a
  // deliberate, stated choice; silently treating it as a pass is what this hook exists to prevent.
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext:
          "outputty: could not verify the grill skill loaded (no readable transcript). " +
          "Allowing the task-graph write — but confirm SPEC actually ran the grill, don't assume it.",
      },
    }),
  );
  process.exit(0);
}

if (loaded) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "The grill skill never loaded in this session, so SPEC ran without its engine — and a task " +
        "graph written on an ungrilled spec is the failure this gate exists to catch.\n\n" +
        "Load it and grill the spec first:  Skill(grill)\n\n" +
        "It carries the checks a summary drops — 'Validate every claim (non-negotiable)' and the " +
        "assumption ledger that marks every premise grounded / absent / unknown. If the work genuinely " +
        "needs no spec (a mechanical fix), it needs no task graph either.",
    },
  }),
);
process.exit(0);
