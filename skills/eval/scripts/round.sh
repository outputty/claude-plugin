#!/usr/bin/env bash
# Runs one eval round: the base plugin and each candidate side by side, on the cases tagged with one section.
# Usage: round.sh <out-dir> <tag[,tag...]|all> <runs> <base-dir> <candidate-dir>...
# EVAL_MODEL picks the model under test (default sonnet); EVAL_ALLOW the granted tools (default Edit Write), for every case in the round.
set -u
out=$1 tag=$2 runs=$3
shift 3
mkdir -p "$out"
flags=(--model "${EVAL_MODEL:-sonnet}" --runs "$runs" -j 3 --ablation none --allow-tools ${EVAL_ALLOW:-Edit Write} --scaffold --trust-plugin --no-publish --keep-temp)
if [ "$tag" != all ]; then for one in ${tag//,/ }; do flags+=(--tag "$one"); done; fi
labels=()
for dir in "$@"; do
  name=$(basename "$dir")
  (cd "$dir" && claude plugin eval . "${flags[@]}" --json "$out/$name.json" > "$out/$name.log" 2>&1) &
  labels+=("$name=$out/$name.json")
done
wait
node "$(dirname "$0")/measure.mjs" "${labels[@]}"
# Every session loads the style, the hook, the rule files and each skill's description; a skill's body loads only when it runs.
for dir in "$@"; do
  always=$( (cat "$dir"/output-styles/*.md "$dir"/hooks/*.md "$dir"/templates/rules/*.md 2>/dev/null; grep -h '^description:' "$dir"/skills/*/SKILL.md) | wc -w | tr -d " ")
  bodies=$(cat "$dir"/skills/*/SKILL.md 2>/dev/null | wc -w | tr -d " ")
  echo "$(basename "$dir"): words loaded every session $always, skill files $bodies"
done
