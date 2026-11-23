#!/usr/bin/env bash
# Renames an unmanaged skill folder to outputty-<name>, and adds `name: <name>` to its frontmatter when it has none, so its command stays.
# Usage: onboard-skill.sh <skills-dir> <folder-name>
set -euo pipefail
dir=$1 name=$2
source="$dir/$name" target="$dir/outputty-$name"
[ -f "$source/SKILL.md" ] || { echo "no SKILL.md in $source" >&2; exit 1; }
[ ! -e "$target" ] || { echo "$target exists" >&2; exit 1; }
mv "$source" "$target"
file="$target/SKILL.md"
awk -v name="$name" '
  NR == 1 && $0 == "---" { print; infront = 1; next }
  infront && $0 == "---" { if (!seen) print "name: " name; infront = 0 }
  infront && /^name:/ { seen = 1 }
  { print }
' "$file" > "$file.tmp"
mv "$file.tmp" "$file"
