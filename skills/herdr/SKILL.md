---
name: herdr
description: "Opens a session in a new Herdr tab once its skill is chosen: a plan, prototype, research or build session for a pick or a handoff. It does not choose between /plan, /prototype, /research and /build; those run their own skill."
---

# herdr

The tab's `claude` runs with `--worktree` and `--permission-mode bypassPermissions`, except the Ask case.

## Steps

- [ ] 1. Outside Herdr (`test "${HERDR_ENV:-}" = 1` fails), print the `claude --worktree …` command for the user to run, and stop.
- [ ] 2. Create every worktree from the latest `main` (the Ask case forks a session in its own worktree and skips this step): `git checkout main` and `git pull` first, or add the worktree from `origin/main` when the primary checkout holds other work.
- [ ] 3. `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$(git rev-parse --show-toplevel)" --label "<label>" --no-focus`, then read `.result.root_pane.pane_id` from what it printed.
- [ ] 4. `herdr agent start <name> --kind claude --pane <pane-id> -- --worktree <worktree> --permission-mode bypassPermissions <model flag> "<the prompt>"`, where the Ask case passes the flags its line gives; everything after `--` reaches `claude`, and the prompt rides as `claude`'s positional argument.
- [ ] 5. Read the pane once and confirm the session started (`/goal active` for a build; an Ask fork inherits the goal and answers only).
  - On an empty tab, retry once, then report.

### The cases

The prompt is the final `agent start` argument.

- **Build**: label `(build) <n> <slug>`, name `build<n>`, `-- --worktree ticket-<n> --model sonnet`; prompt: the `/goal` line `/tickets` printed.
- **Build loop**: label `(build) loop`, name `buildloop`, `-- --worktree build-loop --model sonnet`; prompt: the loop `/goal` line `/tickets` printed.
- **Research**: label `(research) <slug>`, name `research<slug>`, `-- --worktree research-<slug> --model claude-opus-5-5 --effort ultracode`; prompt: `/research <topic>`.
- **Ask**, a user's question during a build: label `(ask) <n>`, name `ask<n>-<count of ask tabs so far>`, tab `--cwd` the build's worktree so `--resume` finds its session, `-- --resume <build session id> --fork-session --model sonnet`, with no `--worktree` and no permission flag; prompt: `You are an ask session forked from build session <id>. Answer only: edit no file, commit nothing, push nothing. Post each ruling as a comment on ticket #<n> that starts with `Ruling:`. Question: <the question>`.
- **Plan**, new or resumed: label `(plan) <n or slug>`, name `plan<n or slug>`, `-- --worktree plan-<slug> --model claude-opus-5-5`; prompt: `/plan <n>` or `/plan <idea>`.
- **Prototype**, of a ticket or an idea: label `(proto) <n or slug>`, name `proto<n or slug>`, `-- --worktree proto-<n or slug> --model haiku`; prompt: `/prototype <n>` or `/prototype <idea>`.

## Do

- Pass `--workspace "$HERDR_WORKSPACE_ID"` to `herdr tab create`.
- Pass `--permission-mode bypassPermissions` to every `herdr agent start` except the Ask case.
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
- **Needs-planning handoff** - a ticket labelled `needs-planning`, opened as a plan session with `/plan <n>`.
- **`/goal`** - the line that sets a session's end condition.
