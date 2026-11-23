---
name: dream
description: 'Reads the transcripts since the last dream and turns each point of friction into a measured, committed edit to a user skill, a rule file, the repo CLAUDE.md or a lint rule. Use on "dream", "retro", "make this a rule", or when the same mistake or correction keeps coming back.'
---

# dream

Input: every transcript since the last dream. Output: one commit per kept edit, each carrying the tool calls and passed counts that kept it, and a `Dream-Through:` marker.

## Steps

Copy this checklist into the reply and tick each item:

- [ ] 1. Read the marker: the last commit in `~/.claude/skills` whose message holds `Dream-Through: <ISO>`. List the sessions active since it, over every project: `bun ${CLAUDE_SKILL_DIR}/scripts/list-sessions.ts --since <ISO>`. Without a marker, ask which date to start from.
- [ ] 2. Flag the friction: `bun ${CLAUDE_SKILL_DIR}/scripts/friction.ts <transcript>...` prints one JSON line per flagged window. Measure the four costliest by tool calls, and list the rest in the report.
- [ ] 3. Drop a window whose work needs `gh`, the network or a PR, with one report line each.
- [ ] 4. Give each remaining window to a Haiku subagent with its JSON line, the user's turns and the names of the skills loaded, never tool output. It returns the cause in one sentence and the skill, rule file, `CLAUDE.md` line or lint rule that caused it.
  - A cause in a skill without the `outputty-` prefix is one report line, and `/outputty:init` offers to manage it.
- [ ] 5. Write the friction as a case on `evals/fixture.sh` under `~/.claude/skills/outputty-<skill>/evals/<section>/<case>/`, per [skills/eval/references/case.md](../eval/references/case.md): the prompt restates the user's turn, names no project's code, data or domain, and carries no line of tool output.
- [ ] 6. Compose the base with `${CLAUDE_PLUGIN_ROOT}/skills/eval/scripts/compose.sh ~/.claude/skills ~/.claude/rules <dir>`, and run the case twice. A base that does not repeat the friction drops the window, with one report line.
- [ ] 7. Draft up to three wordings of the edit, each in its own composed version, and run `/outputty:eval` on the case and on every existing case of the edited file.
- [ ] 8. Keep the wording with the fewest tool calls and turns when it beats the base beyond the noise and no existing case drops below the base. Words may grow.
- [ ] 9. Commit each kept edit on its own, with both runs' tool calls and passed counts in the message: a user skill in `~/.claude/skills`; a rule file in `~/.claude/rules`, its case under `~/.claude/skills/evals/rules/<file>/<section>/<case>/`; a repo `CLAUDE.md` line or lint rule on `dream/<date>` with a PR in that repo.
- [ ] 10. Commit `Dream-Through: <ISO>` in `~/.claude/skills`, empty when nothing was kept, and print the report: one line per window, kept, dropped or listed.

## Do

- Use only user turns, tool names, paths and counts as evidence.
- Run step 7 from a session outside a worktree: a worktree session refuses `claude plugin eval`.
- Extract a session's turns with [references/extract-transcript.sh](references/extract-transcript.sh) when a window needs its words read.

## Don't

- Don't copy a line of tool output into an edit or a case.
- Don't edit a skill or rule without the `outputty-` prefix.

## Glossary

- **Friction** - a window of a transcript flagged for heavy tool use, a repeat read, a long run or a correction.
- **Window** - one user turn and what the assistant and its subagents did before the next.
- **Marker** - the `Dream-Through:` line the last dream commit carries.
- **Base** - the composed plugin before the edit.
