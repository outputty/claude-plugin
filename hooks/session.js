#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically.
//   Checks preconditions and, if any is missing/non-functional, injects a "refuse all work"
//   directive. NOTE this is ADVISORY: a SessionStart hook exiting 0 injects context but cannot deny
//   tool calls (that is the PreToolUse guards' job) - it relies on the model honouring the directive.
//   Verifies capabilities, not just proxies:
//     1. OpenWolf initialised (.wolf/) AND the `openwolf` CLI actually runs
//     2. git initialised
//     3. a git remote is configured, `gh` is authenticated, and origin is a GitHub remote
//   Otherwise inject the protocol + the North Star + Architecture from product.md (NOT the
//   unbounded "What was tried" log - phases read that on demand).
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function block(reason, fix) {
  process.stdout.write(
    "# OUTPUTTY - BLOCKED\n\n" + reason + "\nREFUSE all work until it is fixed. " + fix + "\n"
  );
  process.exit(0);
}
function git(args) {
  try {
    return execSync("git " + args, { cwd: root, stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })
      .toString()
      .trim();
  } catch (e) {
    return null;
  }
}
// returns "ok" | "fail" | "timeout" - so a transient network timeout is not conflated with a real
// negative (which would false-block a validly-set-up but slow/offline machine).
function runs(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "ignore", timeout: 5000, killSignal: "SIGKILL" });
    return "ok";
  } catch (e) {
    return e.code === "ETIMEDOUT" || e.signal === "SIGTERM" || e.signal === "SIGKILL" ? "timeout" : "fail";
  }
}

if (!fs.existsSync(path.join(root, ".wolf"))) {
  block(
    "OpenWolf is not initialised (no `.wolf/`). It is a hard requirement (operational memory + token discipline).",
    "Run `openwolf init` in the project root, then start a new session."
  );
}
if (runs("openwolf --version") !== "ok") {
  block(
    "`.wolf/` exists but the `openwolf` CLI does not run (not installed, not on PATH, or renamed). Every outputty skill assumes a working OpenWolf.",
    "Install OpenWolf and ensure `openwolf` is on PATH, then start a new session (or provide it in CI)."
  );
}
if (git("rev-parse --is-inside-work-tree") !== "true") {
  block(
    "This project is not a git repository. outputty requires git.",
    "Run `git init` and configure a GitHub remote, then start a new session."
  );
}
if (!git("remote")) {
  block(
    "No git remote is configured. outputty tracks every feature in a draft PR from branch-cut, so a remote is required.",
    "Add a remote (`git remote add origin <url>`) and push, then start a new session."
  );
}
let warn = "";
const gh = runs("gh auth status");
if (gh === "fail") {
  block(
    "`gh` is not authenticated, but outputty opens a draft PR from branch-cut with `gh pr create`.",
    "Run `gh auth login` (or set GH_TOKEN in CI), then start a new session."
  );
}
if (gh === "timeout") {
  warn +=
    "\n> WARNING: `gh auth status` timed out (network slow/offline). Skipping the gh-auth precondition this session; `gh pr create` may fail if you are not actually authenticated.\n";
}
const origin = git("remote get-url origin") || "";
if (origin && !/github\.com|git@github/i.test(origin)) {
  block(
    "The `origin` remote is not a GitHub remote, so `gh pr create` will fail: " + origin,
    "Point origin at a GitHub repo, or adapt the flow for your git host, then start a new session."
  );
}

let out =
  "# OUTPUTTY - spec-driven work harness (active)\n\n" +
  "For any feature or change, drive the flow with the `outputty` skill:\n" +
  "  0. BRANCH+PR         - cut `feature/<x>`, create its trail, push, open a DRAFT PR (before any work).\n" +
  "  1. SPEC  (gated)     - grill BUSINESS goals, then TECHNICAL goals, as distinct passes. Log the thought-trail.\n" +
  "  2. PLAN  (gated)     - decompose into LAYERS of TASKS. Get a conversational OK.\n" +
  "  3. BUILD (hands-off) - dispatch task-runner WORKERS (they edit + report; the orchestrator commits each\n" +
  "                         task serially after the layer's QA passes). Two-stage QA; retry once; escalate on double-fail.\n" +
  "Last step: distill the trail into `.claude/product.md` (prune stale), green-gate, mark the PR ready, merge.\n\n" +
  "Brownfield repo with no `.claude/product.md`? Run `outputty-init` first to reconstruct it.\n\n" +
  "Boundaries - never duplicate another tool's job:\n" +
  "  - ponytail  = HOW to build (laziest working diff).\n" +
  "  - OpenWolf  = token discipline + operational memory (anatomy = nav, cerebrum = prefs/gotchas, buglog = bugs).\n" +
  "  - outputty  = the flow + product memory. Decisions go in product.md, NOT cerebrum's decision log.\n";

out += warn;

const product = path.join(root, ".claude", "product.md");
if (fs.existsSync(product)) {
  let doc = fs.readFileSync(product, "utf8");
  const cut = doc.indexOf("\n## What was tried");
  if (cut !== -1) {
    doc =
      doc.slice(0, cut).trimEnd() +
      "\n\n_(\"What was tried\" history is in product.md - read it on demand; not injected every session.)_";
  }
  out += "\n---\n# .claude/product.md - North Star + Architecture\n\n" + doc + "\n";
} else {
  out +=
    "\n(No `.claude/product.md` yet - run `outputty-init` for a brownfield repo, or the first SPEC session creates it.)\n";
}

process.stdout.write(out);
