#!/usr/bin/env node
// outputty SessionStart hook. Runs every session, deterministically. Injects context only (a
// SessionStart hook cannot deny tool calls); REAL work is enforced by the require-environment
// PreToolUse guard. Injects hooks/protocol.md (flow + always-on rules); the protocol tells the agent
// to load product.md itself. Skips everything for subagents. All prose lives in sibling .md files.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

// A subagent's SessionStart carries agent_id/agent_type in the hook input. Scoped micro-agents don't
// need the protocol, so we skip injection for them. No-op if plugin SessionStart never fires for
// subagents; missing/invalid stdin is treated as the main session.
function isSubagent() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
    return !!(input.agent_id || input.agent_type);
  } catch (e) {
    return false;
  }
}

function git(args) {
  try {
    return execSync("git " + args, { cwd: root, stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).toString().trim();
  } catch (e) {
    return null;
  }
}

// "ok" | "fail" | "timeout" - a transient timeout must not read as a real negative.
function runs(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "ignore", timeout: 5000, killSignal: "SIGKILL" });
    return "ok";
  } catch (e) {
    return e.code === "ETIMEDOUT" || e.signal === "SIGTERM" || e.signal === "SIGKILL" ? "timeout" : "fail";
  }
}

// Verify capabilities, not proxies. Return what's missing (to warn); never block the session. Flat
// guard clauses: a later check is meaningless once its prerequisite is absent, so return early.
function missingCapabilities() {
  const missing = [];
  if (!fs.existsSync(path.join(root, ".wolf"))) missing.push("OpenWolf not initialised - run `openwolf init`");
  else if (runs("openwolf --version") !== "ok") missing.push("`openwolf` CLI not runnable - install it / add to PATH");
  if (git("rev-parse --is-inside-work-tree") !== "true") return missing.concat("not a git repository - run `git init`");
  if (!git("remote")) return missing.concat("no git remote - run `git remote add origin <url>`");
  if (runs("gh auth status") === "fail") missing.push("`gh` not authenticated - run `gh auth login`");
  const origin = git("remote get-url origin") || "";
  if (origin && !/github\.com|git@github/i.test(origin)) missing.push("`origin` is not a GitHub remote");
  return missing;
}

// Static prose lives in env-incomplete.md; only the dynamic list is filled in here.
function envWarning(missing) {
  if (!missing.length) return "";
  return read("env-incomplete.md").replace("{{missing}}", missing.map((m) => "  - " + m).join("\n"));
}

// Sequence.
if (isSubagent()) process.exit(0);
process.stdout.write(envWarning(missingCapabilities()) + read("protocol.md"));
