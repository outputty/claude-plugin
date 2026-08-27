#!/usr/bin/env bash
# outputty init installer. Copies the plugin's templates into the repo at $PWD, idempotently.
#   CLAUDE.md                          the managed block, spliced between its markers
#   .claude/rules/*.md                 copied from templates/rules
#   .github/ISSUE_TEMPLATE/task.md     copied
#   .github/PULL_REQUEST_TEMPLATE.md   copied
#   .claude/settings.json              templates/settings.json deep-merged
# Prints one line per file. Runs no git command.
set -euo pipefail

PLUGIN="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
T="$PLUGIN/templates"
BLOCK="$T/CLAUDE.block.md"

command -v node >/dev/null || { echo "install.sh: node is required to merge settings.json" >&2; exit 1; }

if [ ! -f CLAUDE.md ]; then
  cat "$BLOCK" >CLAUDE.md
  echo "CLAUDE.md: created"
elif grep -q '<!-- outputty:begin' CLAUDE.md && grep -q '<!-- outputty:end -->' CLAUDE.md; then
  tmp="$(mktemp "${TMPDIR:-/tmp}/outputty-claude.XXXXXX")"
  trap 'rm -f "$tmp"' EXIT
  awk -v block="$BLOCK" '
    /<!-- outputty:begin/  { skip = 1; while ((getline line < block) > 0) print line; close(block); next }
    /<!-- outputty:end -->/ { skip = 0; next }
    !skip { print }
  ' CLAUDE.md >"$tmp"
  cat "$tmp" >CLAUDE.md
  echo "CLAUDE.md: block replaced, everything outside the markers untouched"
else
  if [ -s CLAUDE.md ] && [ -n "$(tail -c 1 CLAUDE.md)" ]; then printf '\n' >>CLAUDE.md; fi
  printf '\n' >>CLAUDE.md
  cat "$BLOCK" >>CLAUDE.md
  echo "CLAUDE.md: block appended"
fi

mkdir -p .claude/rules .github/ISSUE_TEMPLATE
for f in "$T"/rules/*.md; do
  cp "$f" .claude/rules/
  echo ".claude/rules/$(basename "$f"): copied"
done
cp "$T/ISSUE_TEMPLATE/task.md" .github/ISSUE_TEMPLATE/task.md
echo ".github/ISSUE_TEMPLATE/task.md: copied"
cp "$T/PULL_REQUEST_TEMPLATE.md" .github/PULL_REQUEST_TEMPLATE.md
echo ".github/PULL_REQUEST_TEMPLATE.md: copied"

node -e '
const fs = require("node:fs");
const [file, patchFile] = process.argv.slice(1);
const UNION = new Set(["deny", "ask", "allow"]);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const merge = (base, add) => {
  for (const [k, v] of Object.entries(add)) {
    if (Array.isArray(v)) {
      const had = Array.isArray(base[k]) ? base[k] : [];
      base[k] = UNION.has(k) ? [...new Set([...had, ...v])] : v;
    } else if (isObj(v)) base[k] = merge(isObj(base[k]) ? base[k] : {}, v);
    else base[k] = v;
  }
  return base;
};
const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : "";
let base = {};
if (raw) base = JSON.parse(raw);
fs.writeFileSync(file, JSON.stringify(merge(base, JSON.parse(fs.readFileSync(patchFile, "utf8"))), null, 2) + "\n");
' .claude/settings.json "$T/settings.json"
echo ".claude/settings.json: templates/settings.json merged, other keys preserved"
