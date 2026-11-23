#!/usr/bin/env bash
# Builds one throwaway plugin from this repo's plugin skills, style and hook, plus the user's skills and rules, so `round.sh` and `claude plugin eval` run the composed setup.
# Usage: compose.sh <user-skills-dir> <rules-dir> <out-dir>
# Every outputty-* skill folder and rule file is copied; a skill's evals/trigger case and every evals/<section>/<case> are gathered under <out-dir>/evals/skills/.
set -euo pipefail
# A user with no outputty-* skill or rule yet leaves the globs unmatched; they must expand to nothing, not to their own text.
shopt -s nullglob
skills=$1 rules=$2 out=$3
root=$(cd "$(dirname "$0")/../../.." && pwd)
version=$(jq -r '.plugins[0].version // .version' "$root/.claude-plugin/marketplace.json")

rm -rf "$out"
mkdir -p "$out/.claude-plugin" "$out/hooks" "$out/skills" "$out/templates/rules" "$out/evals/skills/trigger"
cp -R "$root/output-styles" "$out/output-styles"
cp "$root/hooks/context.md" "$out/hooks/context.md"
cp -R "$root"/evals/. "$out/evals/"
for dir in "$root"/skills/*/; do cp -R "$dir" "$out/skills/$(basename "$dir")"; done

for dir in "$skills"/outputty-*/; do
  name=$(basename "$dir")
  # A plugin lists a skill by its folder name, a user's ~/.claude/skills by its frontmatter name, so the prefix is dropped here.
  cp -R "$dir" "$out/skills/${name#outputty-}"
  # The cases are gathered below; left inside the skill they would run twice, from a folder four levels too deep.
  rm -rf "$out/skills/${name#outputty-}/evals"
  [ ! -d "$dir/evals/trigger" ] || cp -R "$dir/evals/trigger" "$out/evals/skills/trigger/${name#outputty-}"
  # Every other section holds cases: evals/<section>/<case>/ lands at evals/skills/<section>/<case>/, four levels under the root like the repo's own.
  for case in "$dir"/evals/*/*/; do
    section=$(basename "$(dirname "$case")")
    [ "$section" = trigger ] || { mkdir -p "$out/evals/skills/$section" && cp -R "$case" "$out/evals/skills/$section/$(basename "$case")"; }
  done
done
[ ! -d "$skills/evals/rules" ] || cp -R "$skills"/evals/rules/. "$out/evals/rules/"

printed=("\${CLAUDE_PLUGIN_ROOT}/hooks/context.md")
for file in "$rules"/outputty-*.md; do
  cp "$file" "$out/templates/rules/$(basename "$file")"
  # A rule with `paths:` frontmatter loads only for matching files, so it is not part of what a session prints at start.
  if awk 'NR == 1 && $0 != "---" { exit 1 } NR > 1 && $0 == "---" { exit 1 } /^paths:/ { exit 0 }' "$file"; then continue; fi
  printed+=("\${CLAUDE_PLUGIN_ROOT}/templates/rules/$(basename "$file")")
done

jq -n --arg version "$version" '{name: "outputty", version: $version, description: "outputty composed with the user skills and rules"}' > "$out/.claude-plugin/plugin.json"
jq -n '$ARGS.positional | {hooks: {SessionStart: [{hooks: [{type: "command", command: "cat", args: .}]}]}}' --args "${printed[@]}" > "$out/hooks/hooks.json"
echo "composed $out: $(ls "$out/skills" | wc -l | tr -d ' ') skills, $((${#printed[@]} - 1)) rule files"
