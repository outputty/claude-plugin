---
name: herdr
description: How a planning, prototype or build session is opened inside Herdr - a new tab in the current workspace, alongside this session, with claude started on the right model in its own worktree and the prompt already sent. Use whenever a pick, a needs-planning handoff, or any "open a session for this" comes up, so the tab, the model and the isolation are never guessed.
---

# herdr

Every plan, prototype and build runs in its own tab of the current Herdr workspace, next to the session that opened it, unless the user says "do it here". The tab's `claude` runs with `--worktree`.

## Steps

- [ ] 1. Outside Herdr (`test "${HERDR_ENV:-}" = 1` fails), print the `claude --worktree …` command for the user to run, and stop.
- [ ] 2. Create every worktree from the latest `main`: `git checkout main` and `git pull` first, or add the worktree from `origin/main` when the primary checkout holds other work.
- [ ] 3. `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$(git rev-parse --show-toplevel)" --label "<label>" --no-focus`, then read `.result.root_pane.pane_id` from what it printed.
- [ ] 4. `herdr agent start <name> --kind claude --pane <pane-id> -- --worktree <worktree> <model flag> "<the prompt>"`; everything after `--` reaches `claude`, and the prompt rides as `claude`'s positional argument, so a leading slash command runs.
- [ ] 5. Read the pane once and confirm the session started (`/goal active` for a build).
  - On an empty tab, retry once, then report.

## The cases

The prompt is the final `agent start` argument.

- **Build**: label `(build) <n> <slug>`, name `build<n>`, `-- --worktree ticket-<n> --model sonnet`; prompt: the `/goal` line `/outputty:tickets` printed.
- **Plan**, new or resumed: label `(plan) <n or slug>`, name `plan<n or slug>`, `-- --worktree plan-<slug> --model claude-opus-5-5`; prompt: `/outputty:plan <n>` or `/outputty:plan <idea>`.
- **Prototype**, of a ticket or an idea: label `(proto) <n or slug>`, name `proto<n or slug>`, `-- --worktree proto-<n or slug> --model haiku`; prompt: `/outputty:prototype <n>` or `/outputty:prototype <idea>`.

## Do

- Pass `--workspace "$HERDR_WORKSPACE_ID"` to `herdr tab create`.
- Run `herdr pane move <pane_id> --tab <tab_id>` to relocate a stray running agent.
- Start `herdr agent start` with the pane at a shell prompt.
- Send the starting prompt only in `agent start`.
- Double-quote the prompt argument and escape its backticks, `$` and inner double quotes.
- Flatten the prompt to one line.
- Keep a `/goal` line under 4000 characters.

## Don't

- Don't run a bare `herdr worktree create --cwd <path>`.
- Don't send a `/goal` with `herdr agent prompt`.

## Glossary

- **Herdr** - the terminal workspace manager that holds a session's tabs.
- **Workspace** - Herdr's group of tabs; `$HERDR_WORKSPACE_ID` names the current one.
- **Pane** - one terminal inside a tab.
- **Pick** - the ticket the user chose to build or plan.
- **Needs-planning handoff** - a ticket labelled `needs-planning`, opened as a plan session with `/outputty:plan <n>`.
- **`/goal`** - the line that sets a session's end condition.
