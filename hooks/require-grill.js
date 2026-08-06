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

/**
 * Report whether a previous session already grilled this branch.
 *
 * SPEC on Monday and PLAN on Tuesday is an ordinary shape for a long cycle, and the transcript check
 * above sees only the current session — so without this the gate denies a graph whose spec was grilled
 * properly, and the fix it demands (grill again) throws away work. The trail is the durable record: SPEC
 * writes a decision line per answered question before asking the next one, so a populated
 * "Decisions so far" is grilling that happened, persisted where the next session can see it.
 *
 * @param {string} taskGraphPath - The `.claude/trails/<branch>.tasks.jsonl` being written.
 * @returns {boolean} true when this branch's trail records at least one settled decision.
 *
 * `grilledEarlier(".claude/trails/feat-x.tasks.jsonl")` -> true when `feat-x.md` has decision lines.
 */
function grilledEarlier(taskGraphPath) {
  const trail = taskGraphPath.replace(/\.tasks\.jsonl$/, ".md");
  let raw;
  try {
    raw = fs.readFileSync(trail, "utf8");
  } catch {
    return false;
  }
  const decisions = raw.split(/^##\s+/m).find((s) => /^Decisions so far/i.test(s)) ?? "";
  return /^\s*-\s+\S/m.test(decisions);
}

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

// Gate the FILE, not the tool. Measured live on 0.29.0: a PLAN wrote a scratchpad generator and ran
// `node gen-tasks.mjs …/<branch>.tasks.jsonl` — a Bash call writing through `fs`, so a Write|Edit-only
// gate never fired and a builder was dispatched off an ungrilled graph. Nothing evasive happened;
// authoring N JSONL lines by hand is tedious and a generator is the obvious move. So any tool call whose
// payload names the task graph counts, whichever field carries it.
const TASK_GRAPH = /\.claude\/trails\/.*\.tasks\.jsonl/;
const ti = input.tool_input || {};
const target = [ti.file_path, ti.command, ti.notebook_path].filter((v) => typeof v === "string").join("\n");
if (!TASK_GRAPH.test(target)) process.exit(0);

// The path is needed on its own for the trail lookup below; a Bash command carries it inline.
const filePath = (
  TASK_GRAPH.test(ti.file_path || "")
    ? ti.file_path
    : (target.match(/\S*\.claude\/trails\/\S*\.tasks\.jsonl/) || [""])[0]
).replace(/["'`]/g, "");

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

// A resumed cycle is not an ungrilled one. The trail outlives the session that wrote it, so a branch
// whose "Decisions so far" is populated was grilled — just not today.
if (grilledEarlier(filePath)) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext:
          "outputty: the grill skill did not load in THIS session, but this branch's trail already " +
          "records settled decisions — so SPEC was grilled in an earlier one. Allowing the task-graph " +
          "write. Re-read the trail before extending the graph; don't re-decide what it already closed.",
      },
    }),
  );
  process.exit(0);
}

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
