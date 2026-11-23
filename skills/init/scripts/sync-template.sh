#!/usr/bin/env bash
# Copies a template tree into a user-owned git repo as outputty-* files, and records each template version on a `template` branch.
# Usage: sync-template.sh <skills|rules> <template-dir> <repo-dir> <version>
# A user's copy is never overwritten. The offers are the diff between the last two template versions, printed on stdout.
set -euo pipefail
kind=$1 src=$2 repo=$3 version=$4

case $kind in
  skills) ignore=$'/*\n!/outputty-*/\n!/evals/\n!/.gitignore' ;;
  rules) ignore=$'/*\n!/outputty-*.md\n!/.gitignore' ;;
  *) echo "kind must be skills or rules: $kind" >&2; exit 2 ;;
esac

stage=$(mktemp -d)
index=$(mktemp -u)
trap 'rm -rf "$stage" "$index"' EXIT

if [ "$kind" = skills ]; then
  for dir in "$src"/*/; do cp -R "$dir" "$stage/outputty-$(basename "$dir")"; done
else
  for file in "$src"/*.md; do cp "$file" "$stage/outputty-$(basename "$file")"; done
fi

mkdir -p "$repo"
[ -d "$repo/.git" ] || git -C "$repo" init -q -b main
[ -e "$repo/.gitignore" ] || printf '%s\n' "$ignore" > "$repo/.gitignore"

for entry in "$stage"/*; do
  [ -e "$repo/$(basename "$entry")" ] || cp -R "$entry" "$repo/"
done

ident=()
git -C "$repo" config user.email > /dev/null || ident=(-c user.name=outputty -c user.email=outputty@localhost)
git -C "$repo" add .gitignore
# Only the outputty-* copies: a .gitignore the user already had would otherwise let this commit take their other files.
git -C "$repo" add -A -- 'outputty-*'
if ! git -C "$repo" diff --cached --quiet; then
  git -C "$repo" ${ident[@]+"${ident[@]}"} commit -q -m "init: outputty-* from template @ $version"
fi

# Plumbing writes the branch, so the checked-out branch and the working tree stay as they are.
git="git --git-dir=$repo/.git --work-tree=$stage"
GIT_INDEX_FILE=$index $git add -f -A
tree=$(GIT_INDEX_FILE=$index $git write-tree)
parent=$(git -C "$repo" rev-parse -q --verify refs/heads/template || true)
if [ -n "$parent" ] && [ "$(git -C "$repo" rev-parse "$parent^{tree}")" = "$tree" ]; then
  echo "template: unchanged at $version, no offers"
  exit 0
fi
commit=$(git -C "$repo" ${ident[@]+"${ident[@]}"} commit-tree "$tree" ${parent:+-p "$parent"} -m "template @ $version")
git -C "$repo" update-ref refs/heads/template "$commit"
if [ -z "$parent" ]; then
  echo "template: created at $version"
  exit 0
fi
echo "template: offers from $version"
git -C "$repo" diff --no-color "$parent" "$commit"
