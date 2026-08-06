#!/usr/bin/env node
/**
 * require-staleness-check.js — a builder is not dispatched against a task nobody re-checked.
 *
 * PreToolUse on Agent. Fires only for an `outputty-builder` dispatch — the moment a task stops being a
 * plan and becomes code.
 *
 * Why this exists: a task is written at PLAN time against the world as it then was. By the time its layer
 * comes up, earlier layers have landed, discovered work has been added, and the user may have been
 * consulted and changed direction. A builder cannot notice — it builds the brief it is handed, faithfully,
 * and a stale brief buys a competent implementation of the wrong thing that master QA finds a whole build
 * later. `build.md` tells the orchestrator to re-read `product.md` before each dispatch; this is what
 * makes "tells" into "must", because a check that depends on remembering to run it is the failure mode
 * this plugin keeps measuring in itself.
 */

const fs = require("fs");

const BUILDER = /outputty-builder/;
const PRODUCT_READ = /"(?:file_path|command)"\s*:\s*"[^"]*\.claude\/product\.md/;

/**
 * Report whether `product.md` was read since the previous builder dispatch.
 *
 * Freshness is per-layer, not per-session: re-reading once at session start and then dispatching five
 * layers is exactly the staleness the gate exists to catch, so the window starts at the last dispatch.
 * Before any dispatch, the whole session counts.
 *
 * @param {string} transcriptPath - JSONL transcript for the current session.
 * @returns {boolean|null} true/false when the transcript is readable, `null` when it is not.
 *
 * `readSinceLastDispatch("/…/abcd.jsonl")` -> false when layer 2 is dispatched off a stale read.
 */
function readSinceLastDispatch(transcriptPath) {
  if (!transcriptPath) return null;
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  const lines = raw.split("\n");
  let window = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (BUILDER.test(lines[i]) && /"subagent_type"/.test(lines[i])) {
      window = i;
      break;
    }
  }
  return lines.slice(window).some((l) => PRODUCT_READ.test(l));
}

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const ti = input.tool_input || {};
if (!BUILDER.test(ti.subagent_type || "")) process.exit(0);

const fresh = readSinceLastDispatch(input.transcript_path);

if (fresh === null) {
  // Cannot verify — say so rather than pretend the gate ran. Allowing an unverifiable case is a
  // deliberate, stated choice; silently treating it as a pass is what this hook exists to prevent.
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext:
          "outputty: could not verify the staleness check ran (no readable transcript). Allowing the " +
          "dispatch — but confirm this task still serves a live roadmap item, don't assume it.",
      },
    }),
  );
  process.exit(0);
}

if (fresh) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "`.claude/product.md` has not been read since the last builder dispatch, so nothing has checked " +
        "whether this task is still the right work.\n\n" +
        "Read it and the branch trail, then answer the four questions in build.md's " +
        '"Before dispatch: is this layer still the right work?" section: which roadmap item does this ' +
        "still serve, does the `contract` match the seams as they now stand, has some of it already " +
        "happened, and can you state in one sentence what done looks like.\n\n" +
        "Stale words are yours to fix (`tasks.js amend <id> --brief`). Work the roadmap no longer wants " +
        "is an escalation, not an edit.",
    },
  }),
);
process.exit(0);
