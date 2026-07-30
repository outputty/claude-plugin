#!/usr/bin/env node
// outputty PreToolUse hook (Edit|Write matcher): surface durable memory about a file BEFORE it is
// edited. Claude Code's auto-memory is push-only — the MEMORY.md index sits in context and the agent
// must choose to open a file — so on a repo with many memories the relevant one is missed exactly when
// it matters. This is the pull half: match the target path against stored memories and inject the hits.
//
// Non-blocking by construction: it only ever emits additionalContext, never a permissionDecision. Any
// failure (no memory dir, unreadable file, malformed stdin) exits 0 silently — a memory aid must never
// be the reason an edit doesn't happen.
const fs = require("fs");
const path = require("path");
const os = require("os");

const MAX_HITS = 3; // context is the budget; three relevant memories is already a lot to act on

/**
 * The auto-memory directory for a project path. Claude Code keys these by the working directory with
 * every path separator replaced by a hyphen (`/Users/x/repo` -> `-Users-x-repo`).
 * @param {string} cwd - the project working directory.
 * @returns {string} absolute path to that project's memory directory.
 */
function memoryDir(cwd) {
  return path.join(os.homedir(), ".claude", "projects", cwd.replace(/[^a-zA-Z0-9]/g, "-"), "memory");
}

/**
 * The search terms a file path contributes: the filename WITH its extension (`session.js`), and the
 * last two path segments (`hooks/session.js`).
 *
 * Deliberately exact. Matching the bare stem or the parent directory was tried and is unusable: on a
 * real memory directory, `hooks` matched three memories that were about subagent mechanics, the plugin
 * cache, and task tools — none of them about the file being edited. A hook that cries wolf on every
 * edit gets ignored, which costs more than staying quiet. The cost of exactness is that this stays
 * silent until a memory actually names a file, which is the intended trade.
 * @param {string} filePath - the path being edited.
 * @returns {string[]} lowercased terms, deduplicated.
 */
function termsFor(filePath) {
  const file = path.basename(filePath);
  const scoped = path.join(path.basename(path.dirname(filePath)), file);
  return [...new Set([file, scoped])].map((t) => t.toLowerCase());
}

/**
 * Memory files whose text mentions any of the terms, excluding the MEMORY.md index (already in context).
 * @param {string} dir - the memory directory.
 * @param {string[]} terms - lowercased search terms.
 * @returns {{name: string, description: string}[]} matches, capped at MAX_HITS.
 */
function search(dir, terms) {
  const hits = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".md") || name === "MEMORY.md") continue;
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    if (!terms.some((t) => text.toLowerCase().includes(t))) continue;
    const matched = text.match(/^description:\s*(.+)$/m);
    const description = matched ? matched[1].replace(/^["']|["']$/g, "") : "";
    hits.push({ name, description });
    if (hits.length === MAX_HITS) break;
  }
  return hits;
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath = input.tool_input && input.tool_input.file_path;
const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
if (!filePath) process.exit(0);

let hits = [];
try {
  hits = search(memoryDir(cwd), termsFor(filePath));
} catch {
  process.exit(0); // no memory directory yet is the normal case, not an error
}
if (!hits.length) process.exit(0);

const lines = hits.map((h) => `- **${h.name}** — ${h.description || "(no description)"}`).join("\n");
process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext:
        `Stored memory mentions \`${path.basename(filePath)}\`. Read any that could change this edit ` +
        `before making it — these were written because something here was non-obvious:\n${lines}`,
    },
  }),
);
