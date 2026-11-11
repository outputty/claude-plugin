---
name: retro
description: Turns a correction the user repeats into something that fails when the mistake returns - a lint rule with a probe test, a reproducing test, a Language line, a hook or permission, or an output-style line. Reads the sessions the user picks (recent ones, or every session since a date). Runs when the user says "retro", "remember this" or "make this a rule"; a build offers it once when it finishes.
---

# retro - turn a repeated correction into a check

A correction is never written down as advice. Each one is routed to a check that fails, a test that fails, a term, a hook or permission, or the output style.

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

For each correction the user made more than once, across the picked sessions, write three lines and nothing more:

1. What went wrong, in one plain sentence.
2. An end-to-end example: what you did, then what the user wanted, in the same shape.
3. The destination, from step 3.

Drop a correction made once, and one that no destination below can hold. Keep at most four, most repeated first. Never group corrections into a summary or a rule.

## 3. Find the destination

Each correction goes to the first destination that can fail on it:

1. **The code's shape is wrong** (a banned import, a structure, a naming or ordering rule): a rule in the linter the repo already runs (an oxlint JS rule, an ESLint rule, ruff, or the repo's own), plus a probe test that reports a bad fixture and allows a good one.
2. **The repo has no linter that can hold it**: a test that reproduces the unwanted behaviour the agents kept producing, and that fails when it comes back. This is the minimum for a correction about behaviour.
3. **A word or term is used wrongly**: one line in the repo's `CLAUDE.md` **Language** section - the term, one sentence, the words it replaces.
4. **The agent's own process is wrong** (spawning subagents, merging or pushing unasked, running a gate badly): a Claude Code hook or a permission rule in `settings.json`, because no test or linter sees a tool call.
5. **How replies look is wrong**: a line in the plugin's own output style, `output-styles/outputty.md` in the outputty repo; it reaches every session on the next version bump.

A correction that fits none of the five is dropped, and the reply says so. A change to an installed file that `/outputty:init` copied also names the template to update in the plugin.

## 4. Build the destination

1. Read the destination file whole, and the nearest existing check of the same kind.
2. Build the check. For 1 and 2, run it against the repeated mistake: it must fail with the mistake present and pass with it fixed. For 4, show the tool call it blocks.
3. Fold a Language line or an output-style line into its file as one piece: merge it into a line that covers the same ground, and delete every line it makes redundant or wrong.
4. Show the user the correction's three lines and the diff.
5. Ask one `AskUserQuestion` per destination: apply, reword, or drop. On reword, return to step 2 with the user's wording, show the new diff, and ask again; apply only on apply.

Apply the picks and commit. Writing nothing is a real outcome.
