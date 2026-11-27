---
name: herdr
description: "Opens a session in a new Herdr tab once its skill is chosen: a plan, prototype, research or build session for a pick or a handoff, and the orchestrator. It does not choose between /plan, /prototype, /research and /build; those run their own skill."
---

# herdr

Every session's `claude` runs with `--permission-mode bypassPermissions`, and with `--worktree` except the orchestrator.

## Steps

- [ ] 1. Outside Herdr (`test "${HERDR_ENV:-}" = 1` fails), print the `claude --worktree …` command for the user to run, and stop.
- [ ] 2. Create every worktree from the latest `main`: `git checkout main` and `git pull` first, or add the worktree from `origin/main` when the primary checkout holds other work.
- [ ] 3. `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$(git rev-parse --show-toplevel)" --label "<label>" --no-focus`, then read `.result.root_pane.pane_id` from what it printed.
- [ ] 4. `herdr agent start <name> --kind claude --pane <pane-id> -- --worktree <worktree> --permission-mode bypassPermissions <model flag> "<the prompt>"`; everything after `--` reaches `claude`, and the prompt rides as `claude`'s positional argument.
- [ ] 5. Read the pane once and confirm the session started (`/goal active` for a build).
  - On an empty tab, retry once, then report.

### The cases

The prompt is the final `agent start` argument.

- **Build**, in the agents tab: name `<repo>-builder-<k>`, where `<repo>` is the repo's name and `<k>` is the lowest number with no `<repo>-builder-<k>` in `herdr agent list`, `-- --worktree ticket-<n> --model haiku --effort ultracode` for a ticket that is well defined and small in scope, else `--model sonnet --effort ultracode`, so the build can run its review as a workflow; prompt: the `/goal` line `/tickets` printed, then `Feature branch: <branch>`, and `GO-AHEAD <branch>` when the user gave one.
- **Build loop**, in the agents tab: name `<repo>-builder-<k>`, `-- --worktree build-loop --model sonnet --effort ultracode`; prompt: the loop `/goal` line `/tickets` printed.
- **Orchestrator**, in the agents tab: name `<repo>-orchestrator`, `-- --model sonnet` with no `--worktree`, in the repo's own checkout; prompt: the line its starter gives, else `/tickets` and start what is buildable.
- **Research**: label `(research) <slug>`, name `research<slug>`, `-- --worktree research-<slug> --model claude-opus-5-5 --effort ultracode`; prompt: `/research <topic>`.
- **Plan**, new or resumed: label `(plan) <n or slug>`, name `plan<n or slug>`, `-- --worktree plan-<slug> --model claude-opus-5-5`; prompt: `/plan <n>` or `/plan <idea>`.
- **Prototype**, of a ticket or an idea: label `(proto) <n or slug>`, name `proto<n or slug>`, `-- --worktree proto-<n or slug> --model haiku`; prompt: `/prototype <n>` or `/prototype <idea>`.

### The screen

The agents tab, labelled `(agents)`, holds the orchestrator and the builders; plan, prototype and research sessions keep their own tabs.

- The orchestrator's pane is the first pane of the tab. Only the repo's own session, finding no `<repo>-orchestrator` in `herdr agent list`, or a blocked builder makes one: the repo's own session renames its own agent with `herdr agent rename <pane-id> <repo>-orchestrator`, and a builder starts one with the Orchestrator case.
- Below the orchestrator come the builders: split each new builder's pane `--direction down` from the lowest pane.
- Start each agent in its new pane with step 4.

### The orchestrator

A session whose own agent, found in `herdr agent list` by `$HERDR_PANE_ID`, is named `<repo>-orchestrator` is the orchestrator.

- Start plan and build sessions per the cases, as the user asks or as `/tickets` shows.
- A message that starts `BLOCKED #<n>:`: tell the user in one line the ticket, the blocker and the ticket filed for the rest, and ask what to do only when the message asks.
- When a builder reports that nothing can ship and other tickets depend on the ticket: tell the user, then send `herdr agent prompt <builder> "/goal clear"`.
- A message that starts `NEEDS-PLANNING #<n>:`: tell the user the ticket and the one line, and offer to open a plan session for it per the Plan case; open it on the user's yes.
- At the start of a batch, a `/goal` run, create `feature/<slug>` from `main` per the `tracker` skill, and name it in each builder's prompt.
- A message that starts `READY #<n>`: tell the user the PR, its branch and the three lines, and ask whether to merge it or everything in the batch. On everything, send `herdr agent prompt <builder> "GO-AHEAD <branch>"` to every builder of the batch; to withdraw it, send `STOP <branch>` the same way.
- When every ticket of a batch is in its feature branch, open the branch's PR into `main` per the `tracker` skill. When the user said "merge everything", merge that PR yourself and tell the user; otherwise tell the user and ask. A merge that deploys waits for the user's yes.
- Build, edit and review nothing.

## Do

- Pass `--workspace "$HERDR_WORKSPACE_ID"` to `herdr tab create`.
- Pass `--permission-mode bypassPermissions` to every `herdr agent start`.
- Name every agent with the repo's name and a dash before its role: herdr agent names are unique across every workspace.
- Send `/compact` and `/goal clear` to a running agent with `herdr agent prompt`.
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
- **Agents tab** - the one tab per workspace that shows the orchestrator and the builders, one above the other.
- **Pick** - the ticket the user chose to build or plan.
- **Needs-planning handoff** - a ticket labelled `needs-planning`, opened as a plan session with `/plan <n>`.
- **`/goal`** - the line that sets a session's end condition.
