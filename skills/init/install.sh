#!/usr/bin/env bash
# outputty init installer. Copies the plugin's templates into the repo at $PWD, idempotently.
#   CLAUDE.md                          the managed block, spliced between its markers (always refreshed)
#   .claude/rules/*.md                 created from templates/rules when absent; an existing file is kept
#   .github/ISSUE_TEMPLATE/task.md     created when absent; an existing file is kept
#   .github/PULL_REQUEST_TEMPLATE.md   created when absent; an existing file is kept
#   .claude/settings.json              templates/settings.json deep-merged
# Prints one line per file. Runs no git command.
set -euo pipefail

PLUGIN="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
T="$PLUGIN/templates"
BLOCK="$T/CLAUDE.block.md"

for src in "$BLOCK" "$T/settings.json" "$T/ISSUE_TEMPLATE/task.md" "$T/PULL_REQUEST_TEMPLATE.md"; do
  [ -f "$src" ] || { echo "install.sh: missing template $src" >&2; exit 1; }
done
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

# copy_if_absent <src> <dst>: a file the repo already has is its own now (it carries the repo's
# corrections), so it is kept and the diff against the template is named.
copy_if_absent() {
  if [ -f "$2" ]; then
    if cmp -s "$1" "$2"; then echo "$2: unchanged"; else echo "$2: kept (differs from $1)"; fi
  else
    cp "$1" "$2"
    echo "$2: created"
  fi
}

mkdir -p .claude/rules .github/ISSUE_TEMPLATE
for f in "$T"/rules/*.md; do copy_if_absent "$f" ".claude/rules/$(basename "$f")"; done
copy_if_absent "$T/ISSUE_TEMPLATE/task.md" .github/ISSUE_TEMPLATE/task.md
copy_if_absent "$T/PULL_REQUEST_TEMPLATE.md" .github/PULL_REQUEST_TEMPLATE.md

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
if (raw) {
  try { base = JSON.parse(raw); }
  catch (e) { console.error("install.sh: " + file + " is not valid JSON. Fix it by hand, then run this again. " + e.message); process.exit(1); }
}
fs.writeFileSync(file, JSON.stringify(merge(base, JSON.parse(fs.readFileSync(patchFile, "utf8"))), null, 2) + "\n");
' .claude/settings.json "$T/settings.json"
echo ".claude/settings.json: templates/settings.json merged, other keys preserved"
