#!/usr/bin/env bash
# Self-test for install.sh, and for the default-branch resolution that step 1 of the init skill runs.
#
# Four scratch repositories under a temp directory, removed on exit:
#   A  a bare repo with none of the four files      asserts create-if-absent
#   B  a repo with notes and its own JSON keys      asserts splice, preserve, and a second run
#   C  a CLAUDE.md with content but no markers      asserts the append path
#   D  a clone whose default branch is `master`     asserts the resolution never assumes `main`
#
# Touches no file in this repo. Exits non-zero on the first failed assertion.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
export CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$HERE/../../.." && pwd)}"
INSTALL="$HERE/install.sh"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/outputty-init-selftest.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}
ok() { echo "ok: $1"; }

# --- A. a repo that has none of the four files ---------------------------------------------------
mkdir -p "$WORK/a"
cd "$WORK/a"
bash "$INSTALL" >/dev/null

for f in CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json; do
  [ -f "$f" ] || fail "A: $f was not created"
done
grep -q '<!-- outputty:begin' CLAUDE.md || fail "A: CLAUDE.md carries no block"
grep -q 'outputty' .claude/output-styles/outputty.md || fail "A: the output style is empty"
node -e '
const s = require(process.argv[1]);
if (s.outputStyle !== "outputty") throw new Error("outputStyle not set");
if (s.permissions.defaultMode !== "auto") throw new Error("defaultMode not auto");
if (!s.permissions.deny.includes("Read(.env)")) throw new Error("deny list not written");
if (!s.permissions.ask.includes("Bash(rm -rf:*)")) throw new Error("ask list not written");
' "$PWD/.claude/settings.json" || fail "A: settings.json is wrong"
node -e '
const m = require(process.argv[1]);
if (m.mcpServers.tasks.command !== "npx") throw new Error("tasks server not registered");
if (m.mcpServers.tasks.args.join(" ") !== "-y @outputty/tasks-mcp") throw new Error("args wrong");
' "$PWD/.mcp.json" || fail "A: .mcp.json is wrong"
ok "A: four files created from an empty repo"

# --- B. a repo with notes of its own, and its own JSON keys --------------------------------------
mkdir -p "$WORK/b/.claude"
cd "$WORK/b"
printf 'my notes above\n\n<!-- outputty:begin stale -->\nstale block body\n<!-- outputty:end -->\n\nmy notes below\n' >CLAUDE.md
printf '{\n  "model": "opus",\n  "permissions": { "allow": ["Bash(ls:*)"], "deny": ["Read(private/**)"] }\n}\n' >.claude/settings.json
printf '{\n  "mcpServers": { "other": { "command": "echo" } }\n}\n' >.mcp.json
bash "$INSTALL" >/dev/null

[ "$(head -n 1 CLAUDE.md)" = "my notes above" ] || fail "B: the note above the block moved"
[ "$(tail -n 1 CLAUDE.md)" = "my notes below" ] || fail "B: the note below the block moved"
if grep -q 'stale block body' CLAUDE.md; then fail "B: the stale block body survived"; fi
[ "$(grep -c '<!-- outputty:begin' CLAUDE.md)" -eq 1 ] || fail "B: the block is not present exactly once"
node -e '
const s = require(process.argv[1]);
if (s.model !== "opus") throw new Error("an unrelated key was dropped");
if (!s.permissions.allow.includes("Bash(ls:*)")) throw new Error("the repo allow list was dropped");
if (!s.permissions.deny.includes("Read(private/**)")) throw new Error("the repo deny list was dropped");
if (!s.permissions.deny.includes("Read(.env)")) throw new Error("the outputty deny list was not added");
' "$PWD/.claude/settings.json" || fail "B: settings.json did not merge"
node -e '
const m = require(process.argv[1]);
if (!m.mcpServers.other) throw new Error("an existing server was dropped");
if (!m.mcpServers.tasks) throw new Error("the tasks server was not added");
' "$PWD/.mcp.json" || fail "B: .mcp.json did not merge"

cp CLAUDE.md "$WORK/b-first-run.md"
cp .claude/settings.json "$WORK/b-first-settings.json"
bash "$INSTALL" >/dev/null
cmp -s "$WORK/b-first-run.md" CLAUDE.md || fail "B: a second run changed CLAUDE.md"
cmp -s "$WORK/b-first-settings.json" .claude/settings.json || fail "B: a second run changed settings.json"
ok "B: block spliced, notes and foreign keys kept, second run is a no-op"

# --- C. a CLAUDE.md that has content but no markers ----------------------------------------------
mkdir -p "$WORK/c-append"
cd "$WORK/c-append"
printf 'existing project notes' >CLAUDE.md # no trailing newline, on purpose
bash "$INSTALL" >/dev/null

[ "$(head -n 1 CLAUDE.md)" = "existing project notes" ] || fail "C: the existing notes moved"
[ "$(sed -n 2p CLAUDE.md)" = "" ] || fail "C: no blank line before the appended block"
grep -q '<!-- outputty:begin' CLAUDE.md || fail "C: the block was not appended"
ok "C: block appended after a blank line, existing notes kept"

# --- D. the default branch is `master`, and nothing may assume `main` ----------------------------
mkdir -p "$WORK/d"
cd "$WORK/d"
git init -q -b master --bare remote.git
git clone -q remote.git work 2>/dev/null
cd work
git config user.email selftest@example.invalid
git config user.name selftest
echo seed >README.md
git add README.md
git commit -qm seed
git push -q origin HEAD:master
git remote set-head origin --auto >/dev/null
BASE="$(git symbolic-ref --short refs/remotes/origin/HEAD)"
[ "$BASE" = "origin/master" ] || fail "D: resolved $BASE, expected origin/master"
ok "D: the default branch resolves to origin/master"

echo "install.sh: all checks passed"
