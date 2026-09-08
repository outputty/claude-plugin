---
name: retro
description: Turns this session's corrections and rework into rules, one narrated round per lesson, each written to the one file that loads it next time. Runs at the end of every planning session and inside every build's docs layer, and on "retro", "lesson", "what should we remember".
---

# retro - one lesson, one round

Each lesson gets its own round: the story that produced it, the file that would hold it, what that file says today, the exact line, and one question. The next lesson does not start until the user answers.

## 1. Read the session from disk

Context is compacted by the time a build's docs layer runs. Read the transcript, never your memory of it.

1. The project directory is `~/.claude/projects/<cwd, with / and . as ->/`.
2. This session is its newest transcript: `ls -t <dir>/*.jsonl | head -1`.
3. Extract the turns to scratch. A transcript reaches several MB, so never `Read` it whole:

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content as $c
  | if ($c|type)=="string" then "\n\n== \(.type) ==\n\($c)"
    else ([$c[]? | select(.type=="text") | .text] | join("\n")) as $t
    | if ($t|length)>0 then "\n\n== \(.type) ==\n\($t)" else empty end end' \
  "$SESSION" > "$SCRATCH/retro-turns.txt"
```

Quote the user's own words from that file. A paraphrase is not evidence.

## 2. Find the candidates

Answer four questions against the extracted turns:

1. Where did the user correct you?
2. Where did you build something, then scrap it?
3. Where did you ask something that was already written down?
4. Where did a claim you carried turn out false?

Keep a hit only if it would change a rule. One-off friction and a bug a commit closed are not lessons.

List every survivor in the reply, one line each, ordered by the rework it cost: `L1`, `L2`, `L3`. State the count. Then open `L1` alone.

## 3. One round per lesson

Write these six parts for one lesson, then stop and ask. Nothing about the next lesson appears yet.

**What drove this.** The friction, narrated from the transcript, with the user's words quoted.

**How it was caught.** Who noticed it, and what exposed it.

**How it was fixed.** Present only when code or a file changed. One end-to-end example: `// before`, `// after`, and the command with its real output.

**Where it would live.** One file, named, from these six:

- a rule for every repo - `~/.claude/rules/<topic>.md`
- a rule for this repo - `.claude/rules/<topic>.md`
- a preference about working with the user - auto-memory, `type: feedback`, with **Why** and **How to apply**
- a fixed moment ("always run X after Y") - a hook in `.claude/settings.json`
- a constraint in a dependency - **Constraints in dependencies** in `.claude/architecture.md`, with its probe
- a dead end - **What was tried before** in the PR body; a rejected design also goes under **Killed** in `.claude/roadmap.md`

Inside `rules/`, a rule holding for every file goes to `code.md`, `issues.md` or `docs.md`; one about a language or folder goes to a file named for it with `paths:` frontmatter, created if absent.

**What that file says today.** Grep it and quote what you find. "Nothing there" is a real answer - say it plainly. Report the search you ran, and control it against a term the file is known to contain.

**Proposed line.** The rule as it would land, in a fenced block: the moment, the action, the date. Write it general; the incident's specifics stay in this reply. An existing line covering the same pattern is sharpened, never doubled.

Then one `AskUserQuestion`, these options in this order:

- Write it, every repo
- Write it, this repo only
- Reword it first
- Not a lesson - drop it
- Delete or merge an existing line instead

Apply the pick. A dropped lesson leaves no trace. Then open the next round.

## 4. Ask what felt off

Every retro ends here, after the last lesson round.

Ask the user what in this session felt off, and which rule got in the way.

Each answer opens its own round, in the same six parts. A rule the user names as a problem is priced for deletion or a merge before it is priced for a rewrite: name it, quote it, say what it costs, then propose removing it.

The retro ends when the user says nothing is left.

## 5. Close

Append one line per applied lesson to `.claude/lessons.md`: the date, the mistake, the change it produced. The lesson remembers; the routed change enforces.

Commit on the current branch. Writing nothing is a real outcome: say so.
