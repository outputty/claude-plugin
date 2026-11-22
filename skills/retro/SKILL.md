---
name: retro
description: Turns a correction the user repeats into a new lint rule, the removal of a lint rule that conflicts with it, or a line in the repo's CLAUDE.md. Reads the sessions the user picks (recent ones, or every session since a date). Runs when the user says "retro", "remember this" or "make this a rule"; a build offers it once when it finishes.
---

# retro

Input: the sessions the user picks. Output: each repeated correction written down where something checks it: a lint rule, or a line in the repo's `CLAUDE.md`.

## Steps

Copy this checklist into the reply and tick each item:

- [ ] 1. List this repo's sessions, across the primary checkout and every worktree: `bun ${CLAUDE_SKILL_DIR}/list-sessions.ts`. It prints the most recently active sessions, newest first, one numbered line each.
- [ ] 2. Show that list in the reply, and ask the user which sessions to read: one or more numbers, or a date. A date covers every session active on or after it: `bun ${CLAUDE_SKILL_DIR}/list-sessions.ts <repo> <YYYY-MM-DD>`.
- [ ] 3. For each picked transcript, extract the turns to `tmp/retro-<n>.txt` with [references/extract-transcript.sh](references/extract-transcript.sh), typing the path in literally.
  - With more than one session, give each to its own subagent, which returns the user's corrections quoted verbatim.
- [ ] 4. For each correction the user made more than once across the picked sessions, write the three lines of [references/correction.md](references/correction.md). Keep at most four, most repeated first.
- [ ] 5. Find each correction's destination, the first of the three that can hold it:
  1. **A new lint rule**: a rule in the linter the repo already runs, plus a probe test that reports a bad fixture and allows a good one.
  2. **A lint rule that conflicts with the correction**: delete it, with its probe test.
  3. **A line in the repo's `CLAUDE.md`**: a **Language** term (the term, one sentence, the words it replaces), or a correction of a line already there.
- [ ] 6. Read the destination file whole, and the nearest existing check of the same kind, then build it.
  - Run a new lint rule against the repeated mistake: it must fail with the mistake present and pass with it fixed.
  - Show a deleted rule beside the correction it blocked.
  - Fold a `CLAUDE.md` line into the file as one piece: merge it into a line that covers the same ground, and delete every line it makes redundant or wrong.
- [ ] 7. Show the user the correction's lines and the diff, and ask one `AskUserQuestion`, four per call, per destination: apply, reword, or drop.
  - On reword, return to step 4 with the user's wording, show the new diff, and ask again; apply only on apply.
- [ ] 8. Apply the picks and commit. Writing nothing is a real outcome.

## Do

- Run `list-sessions.ts`, never read it; it needs bun (`curl -fsSL https://bun.sh/install | bash`) and git.
- Extract with jq (`brew install jq`).
- Drop a correction made once, and one that no destination can hold, and say so in the reply.

## Don't

- Don't group corrections into a summary or a rule.

## Glossary

- **Altitude** - the level of the correction: what went wrong in plain words, not the code that showed it.
- **Check** - what a repeated correction becomes: a new lint rule with a probe test, the removal of a lint rule that conflicts with it, or a line in the repo's `CLAUDE.md`.
- **Probe test** - a test that reports a bad fixture and allows a good one.
