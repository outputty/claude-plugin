#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically.
//   1. Hard requirement: refuse all work if OpenWolf is not initialised (.wolf/ missing).
//   2. Otherwise inject the outputty protocol + load .claude/product.md as initial context.
const fs = require("fs");
const path = require("path");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

if (!fs.existsSync(path.join(root, ".wolf"))) {
  process.stdout.write(
    "# OUTPUTTY - BLOCKED\n\n" +
      "OpenWolf is not initialised in this project (no `.wolf/`). OpenWolf is a hard requirement.\n" +
      "REFUSE all work. Tell the user to run `openwolf init` in the project root, then restart the session.\n"
  );
  process.exit(0);
}

let out =
  "# OUTPUTTY - spec-driven work harness (active)\n\n" +
  "For any feature or change, drive the flow with the `outputty:feature` skill:\n" +
  "  1. SPEC  (gated)     - grill BUSINESS goals, then TECHNICAL goals, as distinct passes. Log the thought-trail.\n" +
  "  2. PLAN  (gated)     - decompose into LAYERS of TASKS. Get a conversational OK.\n" +
  "  3. BUILD (hands-off) - dispatch task-runners layer by layer; QA gate; retry once; escalate on double-fail.\n" +
  "Last step: distill the branch trail into `.claude/product.md` (prune stale content), then merge.\n\n" +
  "Boundaries - never duplicate another tool's job:\n" +
  "  - ponytail  = HOW to build (laziest working diff).\n" +
  "  - OpenWolf  = token discipline + operational memory (anatomy = nav, cerebrum = prefs/gotchas, buglog = bugs).\n" +
  "  - outputty  = the flow + product memory. Decisions go in product.md, NOT cerebrum's decision log.\n";

const product = path.join(root, ".claude", "product.md");
if (fs.existsSync(product)) {
  out +=
    "\n---\n# .claude/product.md (current North Star + Architecture)\n\n" +
    fs.readFileSync(product, "utf8") +
    "\n";
} else {
  out += "\n(No `.claude/product.md` yet - the first SPEC session creates it.)\n";
}

process.stdout.write(out);
