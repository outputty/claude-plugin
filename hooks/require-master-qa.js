#!/usr/bin/env node
/**
 * require-master-qa.js — a build cannot be merged in a session that never ran master QA.
 *
 * PreToolUse on Bash. Fires only for a merge command (`gh pr merge`, `gh stack merge`) — the moment the
 * build stops being reviewable and becomes shipped.
 *
 * Why this exists: master QA runs the target program for real. It is the build's ONLY actual execution;
 * every per-layer write-up is labelled `expected — not yet run` precisely because it has not happened
 * yet. Until 0.30.0 nothing dispatched it: `SKILL.md`'s five-step flow never named it, `build.md` jumped
 * from "Between layers" straight to "After master QA", and the one dispatch instruction sat at the tail
 * of `references/stacking.md` — a file read while publishing layer 1, needed after layer N. Two places
 * downstream treated it as a completed precondition. A skipped gate that leaves every check green is
 * exactly the failure this plugin keeps finding in itself, so the gate gets a gate.
 */

const fs = require("fs");

const MERGE = /\bgh\s+(pr\s+merge|stack\s+merge)\b/;

/**
 * Report whether this session dispatched the master-QA subagent.
 *
 * Reads the transcript rather than any state we keep, so it cannot drift from what actually happened.
 * Matches the namespaced `subagent_type` the dispatch must use — the bare name errors at dispatch, so a
 * run that got as far as spawning anything carries the prefixed form.
 *
 * @param {string} transcriptPath - JSONL transcript for the current session.
 * @returns {boolean|null} true/false when the transcript is readable, `null` when it is not.
 *
 * `ranMasterQa("/…/abcd.jsonl")` -> true once `outputty:outputty-master-qa` has been dispatched.
 */
function ranMasterQa(transcriptPath) {
  if (!transcriptPath) return null;
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  return /outputty-master-qa/.test(raw);
}

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const command = (input.tool_input && input.tool_input.command) || "";
if (!MERGE.test(command)) process.exit(0);

const ran = ranMasterQa(input.transcript_path);

if (ran === null) {
  // Cannot verify — say so rather than pretend the gate ran. Allowing an unverifiable case is a
  // deliberate, stated choice; silently treating it as a pass is what this hook exists to prevent.
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext:
          "outputty: could not verify master QA ran (no readable transcript). Allowing the merge — " +
          "but confirm the target program was actually executed, don't assume it.",
      },
    }),
  );
  process.exit(0);
}

if (ran) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Master QA never ran in this session, so nothing has executed the thing you built — every " +
        "green check below this point is a test suite agreeing with itself.\n\n" +
        "Run it first:  dispatch `outputty:outputty-master-qa` (foreground), per build.md's " +
        '"The graph has drained" section.\n\n' +
        "It is the build's only real run of the target program, which is why every per-layer write-up " +
        "says `expected — not yet run`. If this merge is not a build (a docs fix, a revert), say so and " +
        "merge from a session that did not run one.",
    },
  }),
);
process.exit(0);
