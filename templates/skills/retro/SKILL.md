---
name: retro
description: Turns a correction the user wants remembered into a revised instruction file - the whole owning file re-evaluated, never a line appended. Reads the sessions the user picks (recent ones, or every session since a date). Runs when the user says "retro", "remember this" or "make this a rule"; a build offers it once when it finishes.
---

# retro - revise the file that owns the behaviour

## 1. Pick the sessions

1. List this repo's sessions, across the primary checkout and every worktree: `bun ~/.claude/skills/retro/list-sessions.ts`. It prints the 15 most recently active, newest first, one numbered line each: start and last activity, worktree and branch, user turns, and the first prompt.
2. Show that list in the reply, and ask the user which sessions to read: one or more numbers, or a date. A date covers every session active on or after it: `bun ~/.claude/skills/retro/list-sessions.ts <repo> <YYYY-MM-DD>`.
3. For each picked transcript, extract the turns to `tmp/retro-<n>.txt`, typing the path in literally. With more than one session, give each to its own subagent, which returns the user's corrections quoted verbatim.

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content as $c
  | if ($c|type)=="string" then "\n\n== \(.type) ==\n\($c)"
    else ([$c[]? | select(.type=="text") | .text] | join("\n")) as $t
    | if ($t|length)>0 then "\n\n== \(.type) ==\n\($t)" else empty end end' \
  "<transcript path>" > tmp/retro-<n>.txt
```

## 2. State each lesson at the user's altitude

For each correction the user made, across the picked sessions, write three lines and nothing more:

1. What went wrong, in one plain sentence.
2. An end-to-end example: what you did, then what the user wanted, in the same shape.
3. The owning file, from the map below.

Drop a correction that no file would change. Group repeats of the same correction into one lesson, and keep at most four, most repeated first.

## 3. Find the owning file

Each behaviour has exactly one home:

```text
how replies to the user look           ~/.claude/output-styles/outputty.md
true in every session, any repo        ~/.claude/CLAUDE.md, below the outputty block
the flow, the doc map, repo standing   <repo>/CLAUDE.md, outputty block
terms and repo facts                   <repo>/CLAUDE.md, Language and This repo
conduct true in this repo only         <repo>/.claude/rules/<topic>.md
a step of plan, build, tickets, herdr  that skill's SKILL.md
a gh command, ticket or PR body rule   tracker skill
the shape of a ticket or PR            .github/ templates
the shape of a .claude doc or README   the doc itself, or ~/.claude/readme-template.md
how docs are written                   documentation skill
rules for one language's files         ~/.claude/rules/<language>.md, with paths:
knowledge of one tool or vendor        ~/.claude/skills/<domain>/, from ~/.claude/skill-template.md
must never happen, broke after a rule  permissions.deny or a hook in settings.json
```

A file that `/outputty:init` installed also has a template in the plugin. Change the installed file, and name the template to update in the reply.

## 4. Re-evaluate the whole file

1. Read the owning file whole.
2. Rewrite it as one piece that holds the lesson. Merge the lesson into an existing line, generalise a line that covered one case, and delete every line that the lesson makes redundant, wrong or dead. The file ends no longer than it started, unless the lesson is new ground with nothing to merge into.
3. Write each line as a plain prescription, with no date, ticket number or story.
4. Show the user the lesson's three lines, the file's size before and after, and the diff.
5. When the lesson repeats a rule that is already written, also build the mechanism that fails loudly in the same change: a `permissions.deny` entry, a hook, a lint rule or a test.
6. Ask one `AskUserQuestion` per file: apply, reword, or drop.

Apply the picks and commit. Writing nothing is a real outcome.
