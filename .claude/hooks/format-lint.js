#!/usr/bin/env node
// outputty dev hook (PostToolUse: Write|Edit|MultiEdit). On every edit to a .js/.json file it runs the
// repo's npm scripts — `format:file` (prettier --write) and, for JS, `lint:file` (oxlint) — surfacing
// any lint findings as feedback. Dev tooling for the plugin itself, NOT shipped. Silent no-op when the
// file isn't code, the deps aren't installed, npm isn't available, or the input can't be parsed.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * The path of the file the tool just wrote, from the PostToolUse hook input on stdin.
 * @returns {string} the file path, or "" when unavailable.
 */
function editedFile() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
    const inp = input.tool_input || {};
    return inp.file_path || inp.path || "";
  } catch {
    return "";
  }
}

const file = editedFile();
// Only touch code prettier/oxlint own; skip everything else, and abstain on missing deps.
const isCode = /\.(js|mjs|cjs|json)$/.test(file);
const inVendor = /[\\/](node_modules|\.wolf|prod)[\\/]/.test(file);
if (!file || !isCode || inVendor || !fs.existsSync(file)) process.exit(0);
if (!fs.existsSync(path.join(root, "node_modules"))) process.exit(0); // deps not installed

// npm ships with node (which this hook already needs), so it's available wherever the hook runs.
// Probe it once so a genuinely missing npm abstains instead of being read as a lint failure below.
try {
  execSync("npm --version", { cwd: root, stdio: "ignore" });
} catch {
  process.exit(0);
}

// 1. Format (js + json) via the `format:file` script. A prettier parse error must not block the edit.
try {
  execSync(`npm run --silent format:file -- "${file}"`, { cwd: root, stdio: "ignore" });
} catch {
  /* leave the file as-is */
}

// 2. Lint (js only) via `lint:file`. npm is known-good now, so a non-zero exit means oxlint findings —
// surface them to Claude as feedback (exit 2).
if (/\.(js|mjs|cjs)$/.test(file)) {
  try {
    execSync(`npm run --silent lint:file -- "${file}"`, { cwd: root, stdio: "pipe" });
  } catch (e) {
    process.stderr.write((e.stdout || "").toString() + (e.stderr || "").toString());
    process.stderr.write("\noxlint flagged the edit above — fix the reported issues.\n");
    process.exit(2);
  }
}
process.exit(0);
