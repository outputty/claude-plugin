#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically.
//   It INJECTS CONTEXT only (a SessionStart hook cannot deny tool calls). If the environment is
//   incomplete it injects a warning naming what's missing; read-only work still proceeds. REAL work
//   is enforced elsewhere: the require-environment PreToolUse guard DENIES file edits until OpenWolf
//   + git are present, and the outputty flow additionally needs a GitHub remote + authenticated gh.
//   Always injects protocol.md (flow + always-on rules) + the North Star + Architecture from product.md.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// A subagent's SessionStart carries agent_id/agent_type in the hook input. Scoped micro-agents
// (executor, QA, commit) don't need the protocol + North Star, so skip injection entirely — that ~3k
// boot cost, paid per subagent, is pure waste. No-op if plugin SessionStart never fires for subagents
// (agent_type absent -> full injection below, exactly as before).
try {
  const hookInput = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  if (hookInput.agent_id || hookInput.agent_type) process.exit(0);
} catch (e) {
  /* no or invalid stdin: treat as the main session and inject normally */
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
// "ok" | "fail" | "timeout" - a transient timeout must not be read as a real negative.
function runs(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "ignore", timeout: 5000, killSignal: "SIGKILL" });
    return "ok";
  } catch (e) {
    return e.code === "ETIMEDOUT" || e.signal === "SIGTERM" || e.signal === "SIGKILL" ? "timeout" : "fail";
  }
}

// Verify capabilities, not proxies. Collect what's missing (warn); do not block the session.
const missing = [];
if (!fs.existsSync(path.join(root, ".wolf"))) missing.push("OpenWolf not initialised - run `openwolf init`");
else if (runs("openwolf --version") !== "ok") missing.push("`openwolf` CLI not runnable - install it / add to PATH");
if (git("rev-parse --is-inside-work-tree") !== "true") missing.push("not a git repository - run `git init`");
else {
  if (!git("remote")) missing.push("no git remote - run `git remote add origin <url>`");
  else {
    if (runs("gh auth status") === "fail") missing.push("`gh` not authenticated - run `gh auth login`");
    const origin = git("remote get-url origin") || "";
    if (origin && !/github\.com|git@github/i.test(origin)) missing.push("`origin` is not a GitHub remote");
  }
}

let out = "";
if (missing.length) {
  out +=
    "# OUTPUTTY - environment incomplete\n\n" +
    "Read-only work (reading, searching, answering) is fine, but REAL work is gated: the\n" +
    "require-environment guard denies file edits until OpenWolf + git are set up, and the outputty\n" +
    "flow additionally needs a GitHub remote + authenticated `gh`. Missing here:\n" +
    missing.map((m) => "  - " + m).join("\n") +
    "\nFix these before doing real work in this project.\n\n---\n";
}

out += fs.readFileSync(path.join(__dirname, "protocol.md"), "utf8");

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
