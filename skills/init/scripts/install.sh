#!/usr/bin/env bash
# outputty init installer. Execute this file; never read it into context.
#
# Writes four files into the repo at $PWD, idempotently:
#   CLAUDE.md                          the managed outputty block, spliced between its markers
#   .claude/output-styles/outputty.md  the writing standard, overwritten from the plugin's copy
#   .claude/settings.json              outputStyle, worktree.baseRef and permissions, deep-merged
#   .mcp.json                          the tasks server entry, deep-merged
#
# A target the repo does not have is created. A JSON target that does not parse aborts the run.
# Prints one line per file. Touches nothing else, and runs no git command.
set -euo pipefail

PLUGIN="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/../../.." && pwd)}"
BLOCK="$PLUGIN/skills/init/block.md"
STYLE="$PLUGIN/skills/init/output-style.md"

for src in "$BLOCK" "$STYLE"; do
  [ -f "$src" ] || {
    echo "install.sh: missing template $src" >&2
    exit 1
  }
done

command -v node >/dev/null || {
  echo "install.sh: node is required to merge the JSON files" >&2
  exit 1
}

# --- CLAUDE.md ---------------------------------------------------------------------------------
# Three paths: replace the managed region, append the block, or create the file. Everything
# outside the markers is copied through untouched, which is what makes a re-run safe.
if [ ! -f CLAUDE.md ]; then
  cat "$BLOCK" >CLAUDE.md
  echo "CLAUDE.md: created, block written"
elif grep -q '<!-- outputty:begin' CLAUDE.md && grep -q '<!-- outputty:end -->' CLAUDE.md; then
  tmp="$(mktemp "${TMPDIR:-/tmp}/outputty-claude.XXXXXX")"
  trap 'rm -f "$tmp"' EXIT
  awk -v block="$BLOCK" '
    /<!-- outputty:begin/  { skip = 1; while ((getline line < block) > 0) print line; close(block); next }
    /<!-- outputty:end -->/ { skip = 0; next }
    !skip { print }
  ' CLAUDE.md >"$tmp"
  cat "$tmp" >CLAUDE.md
  echo "CLAUDE.md: block replaced, every line outside the markers untouched"
else
  # A blank line before the block, and exactly one, whether or not the file ended in a newline.
  if [ -s CLAUDE.md ] && [ -n "$(tail -c 1 CLAUDE.md)" ]; then printf '\n' >>CLAUDE.md; fi
  printf '\n' >>CLAUDE.md
  cat "$BLOCK" >>CLAUDE.md
  echo "CLAUDE.md: block appended"
fi

# --- the output style --------------------------------------------------------------------------
mkdir -p .claude/output-styles
cat "$STYLE" >.claude/output-styles/outputty.md
echo ".claude/output-styles/outputty.md: overwritten from the plugin's copy"

# --- the two JSON files ------------------------------------------------------------------------
# merge_json <file> <patch>: deep-merge the patch into the file, creating the file from {} when it
# is absent. Arrays under deny/ask/allow accumulate, so a repo's own entries survive. Every other
# array is replaced outright, so a re-run cannot union `args` into nonsense.
merge_json() {
  node -e '
const fs = require("node:fs");
const [file, patch] = process.argv.slice(1);
const UNION = new Set(["deny", "ask", "allow"]);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const merge = (base, add) => {
  for (const [k, v] of Object.entries(add)) {
    if (Array.isArray(v)) {
      const had = Array.isArray(base[k]) ? base[k] : [];
      base[k] = UNION.has(k) ? [...new Set([...had, ...v])] : v;
    } else if (isObj(v)) {
      base[k] = merge(isObj(base[k]) ? base[k] : {}, v);
    } else {
      base[k] = v;
    }
  }
  return base;
};
const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : "";
let base = {};
if (raw) {
  try {
    base = JSON.parse(raw);
  } catch (e) {
    console.error("install.sh: " + file + " is not valid JSON. Fix it, then run this again. " + e.message);
    process.exit(1);
  }
}
fs.writeFileSync(file, JSON.stringify(merge(base, JSON.parse(patch)), null, 2) + "\n");
' "$1" "$2"
}

mkdir -p .claude
merge_json .claude/settings.json '{
  "outputStyle": "outputty",
  "worktree": { "baseRef": "head" },
  "permissions": {
    "defaultMode": "auto",
    "deny": [
      "Read(.env)", "Edit(.env)", "Write(.env)",
      "Read(.env.local)", "Edit(.env.local)", "Write(.env.local)",
      "Read(secrets/**)", "Edit(secrets/**)", "Write(secrets/**)",
      "Read(*.pem)", "Edit(*.pem)", "Write(*.pem)",
      "Read(*.key)", "Edit(*.key)", "Write(*.key)",
      "Read(credentials.json)", "Edit(credentials.json)", "Write(credentials.json)"
    ],
    "ask": [
      "Bash(rm -rf:*)",
      "Bash(git clean -f:*)"
    ]
  }
}'
echo ".claude/settings.json: outputStyle + worktree + permissions merged, every other key preserved"

merge_json .mcp.json '{
  "mcpServers": {
    "tasks": {
      "command": "npx",
      "args": ["-y", "@outputty/tasks-mcp", "--sync-interval", "60"]
    }
  }
}'
echo ".mcp.json: tasks server merged, every other server preserved"
