---
name: retro
description: Turns a correction the user wants remembered into one rule line. Runs only when the user says "retro", "remember this" or "make this a rule".
---

# retro - one line, on request

## 1. Read the session

Read the transcript from disk, because context may be compacted.

1. The project directory is `~/.claude/projects/<cwd, with / and . as ->/`. Its newest `*.jsonl` is this session.
2. Extract the turns to `tmp/retro-turns.txt`, typing the transcript path in literally:

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content as $c
  | if ($c|type)=="string" then "\n\n== \(.type) ==\n\($c)"
    else ([$c[]? | select(.type=="text") | .text] | join("\n")) as $t
    | if ($t|length)>0 then "\n\n== \(.type) ==\n\($t)" else empty end end' \
  "<transcript path>" > tmp/retro-turns.txt
```

## 2. Propose

1. If the user named a rule that got in the way, offer to delete it first.
2. List at most four candidates, each one line, each a correction the user made in their own words. Grep the rule homes for an existing line on the same pattern. When one exists, propose to change that line instead of adding a sibling.
3. Ask one `AskUserQuestion` with `multiSelect: true`. Each option names the line and its home.

## 3. Write

- A line holds in every repo: `~/.claude/CLAUDE.md`, inside the outputty block. A line about this repo only: `.claude/rules/<topic>.md`.
- Write the rule as one prescriptive line with no date, no ticket number and no story.
- A rule that broke again after it was written becomes a hook or a `permissions.deny` entry, not another line.

Commit on the current branch. Writing nothing is a real outcome.
