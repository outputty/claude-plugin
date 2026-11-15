---
name: retro
description: Turns a correction the user repeats into a new lint rule, the removal of a lint rule that conflicts with it, or a line in the repo's CLAUDE.md. Reads the sessions the user picks (recent ones, or every session since a date). Runs when the user says "retro", "remember this" or "make this a rule"; a build offers it once when it finishes.
---

# retro - turn a repeated correction into a check

A correction is written down only where something checks it: a lint rule, or a line in the repo's `CLAUDE.md`.

Copy this checklist into the reply and tick each item:

- [ ] Sessions listed and picked (1)
- [ ] Transcripts extracted to tmp/retro-<n>.txt (1)
- [ ] Corrections stated (2)
- [ ] Destination found per correction (3)
- [ ] Destination built, diff shown (4)
- [ ] User picked apply, reword or drop (4)
- [ ] Picks applied and committed

## 1. Pick the sessions

1. List this repo's sessions, across the primary checkout and every worktree: `bun ~/.claude/skills/retro/list-sessions.ts`. Run the script, never read it. It needs bun (`curl -fsSL https://bun.sh/install | bash`) and git. It prints the 15 most recently active, newest first, one numbered line each: start and last activity, worktree and branch, user turns, and the first prompt.
2. Show that list in the reply, and ask the user which sessions to read: one or more numbers, or a date. A date covers every session active on or after it: `bun ~/.claude/skills/retro/list-sessions.ts <repo> <YYYY-MM-DD>`.
3. For each picked transcript, extract the turns to `tmp/retro-<n>.txt`, typing the path in literally. With more than one session, give each to its own subagent, which returns the user's corrections quoted verbatim. Requires jq (`brew install jq`, or your package manager's `jq`).

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content as $c
  | if ($c|type)=="string" then "\n\n== \(.type) ==\n\($c)"
    else ([$c[]? | select(.type=="text") | .text] | join("\n")) as $t
    | if ($t|length)>0 then "\n\n== \(.type) ==\n\($t)" else empty end end' \
  "<transcript path>" > tmp/retro-<n>.txt
```

## 2. State each correction at the user's altitude

For each correction the user made more than once, across the picked sessions, write these lines and nothing more:

1. What went wrong, in one plain sentence.
2. An end-to-end example: what you did, then what the user wanted, in the same shape.
3. The destination, from step 3.

Drop a correction made once, and one that no destination below can hold. Keep at most four, most repeated first. Never group corrections into a summary or a rule.

## 3. Find the destination

Each correction goes to the first destination that can hold it:

1. **A new lint rule**: a rule in the linter the repo already runs (an oxlint JS rule, an ESLint rule, ruff, or the repo's own), plus a probe test that reports a bad fixture and allows a good one.
2. **A lint rule that conflicts with the correction**: delete it, with its probe test.
3. **A line in the repo's `CLAUDE.md`**: a **Language** term (the term, one sentence, the words it replaces), or a correction of a line already there.

A correction that fits none is dropped, and the reply says so.

## 4. Build the destination

1. Read the destination file whole, and the nearest existing check of the same kind.
2. Build it. Run a new lint rule against the repeated mistake: it must fail with the mistake present and pass with it fixed. Show a deleted rule beside the correction it blocked.
3. Fold a `CLAUDE.md` line into the file as one piece: merge it into a line that covers the same ground, and delete every line it makes redundant or wrong.
4. Show the user the correction's lines and the diff.
5. Ask one `AskUserQuestion` per destination: apply, reword, or drop. On reword, return to step 2 with the user's wording, show the new diff, and ask again; apply only on apply.

Apply the picks and commit. Writing nothing is a real outcome.
