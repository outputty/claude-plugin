---
name: herdr
description: How a planning or build session is opened inside Herdr - a new tab in the current workspace, alongside this session, with claude started on the right model in its own worktree and the prompt already sent. Use whenever a pick, a needs-planning handoff, or any "open a session for this" comes up, so the tab, the model and the isolation are never guessed.
---

# herdr - a new tab alongside this session

Every plan and every build runs in its own tab of the current Herdr workspace, next to the session that opened it. The tab's `claude` runs with `--worktree`, so the checkout is isolated inside the tab; the tab itself is never a separate worktree or workspace.

Check `test "${HERDR_ENV:-}" = 1` first. Outside Herdr, print the `claude --worktree …` command for the user to run, and stop.

## Open a tab and start the agent

1. `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$(git rev-parse --show-toplevel)" --label "<label>" --no-focus`, then read `.result.root_pane.pane_id` from what it printed.
2. `herdr agent start <name> --kind claude --pane <pane-id> -- --worktree <branch> <model flag>`; everything after `--` reaches `claude`.
3. `herdr agent prompt <name> "<the line>"`, with no `--wait`.

Then stop polling or reading that pane. The handed-off session owns its turns from here.

## The two cases

A build:

- label `(build) <n> <slug>`, name `build<n>`, `-- --worktree ticket-<n> --model sonnet`.
- prompt: the `/goal` line `/tickets` printed.
- Sonnet, because the layers are mechanical once planned; the Fable advisor from the repo settings covers the judgement calls.

A plan, new or resumed:

- label `(plan) <n or slug>`, name `plan<n or slug>`, `-- --worktree plan-<slug>`, no model flag.
- prompt: `/plan <n>` or `/plan <idea>`.
- The default model, because planning's judgement calls are the expensive part.

## Traps

- `--workspace "$HERDR_WORKSPACE_ID"` on `herdr tab create` keeps the tab in this workspace; a bare `herdr worktree create --cwd <path>` opens a brand-new workspace instead. If a tab landed in the wrong place, `herdr pane move <pane_id> --tab <tab_id>` relocates the running agent without restarting it; `pane move` changes the pane's tab, never its cwd or its process.
- `herdr agent start` needs the pane at a shell prompt; a tab created with `--no-focus` is.
- Never run `/plan` or `/build` inline in the session that runs `/tickets`; that session stays on `main`.
