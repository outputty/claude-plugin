#!/usr/bin/env bash
# Builds one throwaway plugin from this repo's plugin skills, style and hook, plus the user's skills and rules, so `round.sh` and `claude plugin eval` run the composed setup.
# Usage: compose.sh <user-skills-dir> <rules-dir> <out-dir>
# Every outputty-* skill folder and rule file is copied; a skill's evals/trigger and evals/split/* cases are gathered under <out-dir>/evals/skills/.
set -euo pipefail
# A user with no outputty-* skill or rule yet leaves the globs unmatched; they must expand to nothing, not to their own text.
shopt -s nullglob
skills=$1 rules=$2 out=$3
root=$(cd "$(dirname "$0")/../../.." && pwd)
version=$(jq -r '.plugins[0].version // .version' "$root/.claude-plugin/marketplace.json")

rm -rf "$out"
mkdir -p "$out/.claude-plugin" "$out/hooks" "$out/skills" "$out/templates/rules" "$out/evals/skills/trigger" "$out/evals/skills/split"
cp -R "$root/output-styles" "$out/output-styles"
cp "$root/hooks/context.md" "$out/hooks/context.md"
cp -R "$root"/evals/. "$out/evals/"
for dir in "$root"/skills/*/; do cp -R "$dir" "$out/skills/$(basename "$dir")"; done

for dir in "$skills"/outputty-*/; do
  name=$(basename "$dir")
  cp -R "$dir" "$out/skills/$name"
  [ ! -d "$dir/evals/trigger" ] || cp -R "$dir/evals/trigger" "$out/evals/skills/trigger/${name#outputty-}"
  for case in "$dir"/evals/split/*/; do
    [ ! -d "$case" ] || cp -R "$case" "$out/evals/skills/split/$(basename "$case")"
  done
done
[ ! -d "$skills/evals/rules" ] || cp -R "$skills"/evals/rules/. "$out/evals/rules/"

printed=("\${CLAUDE_PLUGIN_ROOT}/hooks/context.md")
for file in "$rules"/outputty-*.md; do
  cp "$file" "$out/templates/rules/$(basename "$file")"
  printed+=("\${CLAUDE_PLUGIN_ROOT}/templates/rules/$(basename "$file")")
done

jq -n --arg version "$version" '{name: "outputty", version: $version, description: "outputty composed with the user skills and rules"}' > "$out/.claude-plugin/plugin.json"
jq -n '$ARGS.positional | {hooks: {SessionStart: [{hooks: [{type: "command", command: "cat", args: .}]}]}}' --args "${printed[@]}" > "$out/hooks/hooks.json"
echo "composed $out: $(ls "$out/skills" | wc -l | tr -d ' ') skills, $((${#printed[@]} - 1)) rule files"
