#!/usr/bin/env bash
# Runs one eval round: the base plugin and each candidate side by side, on the cases tagged with one section.
# Usage: round.sh <out-dir> <tag|all> <runs> <base-dir> <candidate-dir>...
# EVAL_MODEL picks the model under test (default sonnet).
set -u
out=$1 tag=$2 runs=$3
shift 3
mkdir -p "$out"
flags=(--model "${EVAL_MODEL:-sonnet}" --runs "$runs" -j 3 --ablation none --allow-tools Edit Write --scaffold --trust-plugin --no-publish --keep-temp)
if [ "$tag" != all ]; then flags+=(--tag "$tag"); fi
labels=()
for dir in "$@"; do
  name=$(basename "$dir")
  (cd "$dir" && claude plugin eval . "${flags[@]}" --json "$out/$name.json" > "$out/$name.log" 2>&1) &
  labels+=("$name=$out/$name.json")
done
wait
node "$(dirname "$0")/measure.mjs" "${labels[@]}"
