#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically.
//   Hard preconditions - block ALL work if any is missing:
//     1. OpenWolf initialised (.wolf/)
//     2. git initialised
//     3. a git remote is configured
//   Otherwise inject the outputty protocol + load .claude/product.md as initial context.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function block(reason, fix) {
  process.stdout.write("# OUTPUTTY - BLOCKED\n\n" + reason + "\nREFUSE all work. " + fix + "\n");
  process.exit(0);
}
function git(args) {
  try {
    return execSync("git " + args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (e) {
    return null;
  }
}

if (!fs.existsSync(path.join(root, ".wolf"))) {
  block(
    "OpenWolf is not initialised (no `.wolf/`). It is a hard requirement (operational memory + token discipline).",
    "Tell the user to run `openwolf init`, then restart the session."
  );
}
if (git("rev-parse --is-inside-work-tree") !== "true") {
  block(
    "This project is not a git repository. outputty requires git.",
    "Tell the user to run `git init` and configure a remote, then restart the session."
  );
}
if (!git("remote")) {
  block(
    "No git remote is configured. outputty tracks every feature in a draft PR from branch-cut, so a remote is required.",
    "Tell the user to add a remote (`git remote add origin <url>`) and push, then restart the session."
  );
}

let out =
  "# OUTPUTTY - spec-driven work harness (active)\n\n" +
  "For any feature or change, drive the flow with the `outputty` skill:\n" +
  "  0. BRANCH+PR         - cut `feature/<x>`, create its trail, push, open a DRAFT PR (before any work).\n" +
  "  1. SPEC  (gated)     - grill BUSINESS goals, then TECHNICAL goals, as distinct passes. Log the thought-trail.\n" +
  "  2. PLAN  (gated)     - decompose into LAYERS of TASKS. Get a conversational OK.\n" +
  "  3. BUILD (hands-off) - dispatch task-runners layer by layer; QA gate; retry once; escalate on double-fail.\n" +
  "Last step: distill the trail into `.claude/product.md` (prune stale), mark the PR ready, merge.\n\n" +
  "Brownfield repo with no `.claude/product.md`? Run `outputty-init` first to reconstruct it.\n\n" +
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
  out +=
    "\n(No `.claude/product.md` yet - run `outputty-init` for a brownfield repo, or the first SPEC session creates it.)\n";
}

process.stdout.write(out);
