#!/usr/bin/env node
// outputty dev hook (PostToolUse: Write|Edit|MultiEdit). Formats the edited file with prettier and
// lints it with oxlint using this repo's local devDependencies. Dev tooling for the plugin itself —
// NOT shipped in the plugin. Silent no-op when the file isn't code, the deps aren't installed, or the
// input can't be parsed, so it never blocks editing.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

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

const prettier = path.join(root, "node_modules", "prettier", "bin", "prettier.cjs");
const oxlint = path.join(root, "node_modules", "oxlint", "bin", "oxlint");
if (!fs.existsSync(prettier)) process.exit(0); // deps not installed — abstain

// 1. Format in place. A prettier parse error must not block the edit.
try {
  execFileSync(process.execPath, [prettier, "--write", file], { cwd: root, stdio: "ignore" });
} catch {
  /* leave the file as-is */
}

// 2. Lint (JS only — oxlint doesn't lint JSON). Surface findings to Claude as feedback via exit 2.
if (/\.(js|mjs|cjs)$/.test(file) && fs.existsSync(oxlint)) {
  try {
    execFileSync(process.execPath, [oxlint, file], { cwd: root, stdio: "pipe" });
  } catch (e) {
    process.stderr.write((e.stdout || "").toString() + (e.stderr || "").toString());
    process.stderr.write("\noxlint flagged the edit above — fix the reported issues.\n");
    process.exit(2);
  }
}
process.exit(0);
