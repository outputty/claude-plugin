---
name: herdr
description: "Opens a session in a new Herdr tab once its skill is chosen: a plan, prototype, research or build session for a pick or a handoff, and the orchestrator. It does not choose between /plan, /prototype, /research and /build; those run their own skill."
---

# herdr

Every session's `claude` runs with `--permission-mode bypassPermissions` except a plan or question session's, and with `--worktree` except the orchestrator. The script `scripts/session.mjs` starts them all.

## Steps

- [ ] 1. Outside Herdr (`test "${HERDR_ENV:-}" = 1` fails), print the `claude --worktree …` command for the user to run, and stop.
- [ ] 2. Create every worktree from the latest `main`: `git checkout main` and `git pull` first, or add the worktree from `origin/main` when the primary checkout holds other work.
- [ ] 3. Run `node <this skill's dir>/scripts/session.mjs <case> <flags>` per The cases: it creates the tab and the pane, picks the name, and starts `claude` with the case's flags and its prompt as an argument, so nothing needs quoting. A plan or question session starts without `--permission-mode bypassPermissions`, so it starts in the default mode with nothing to enable.
- [ ] 4. After a failure run the same command again: it starts nothing when the agent exists, and tries a start that never reached `herdr agent list` once more.
- [ ] 5. Read the pane once and confirm the session started (`/goal active` for a build).
  - On an empty tab, retry once, then report.

### The cases

Each case is `node <this skill's dir>/scripts/session.mjs <case> …`, which sets the name, tab, worktree, model and permission mode.

- **Build**, in the agents tab: `build --ticket <n> --goal "<the /goal line the tracker skill printed>" --feature <branch>`, with `--go-ahead` when the user gave one and `--small` for a ticket that is well defined and small in scope (Haiku, else Sonnet).
- **Build loop**, in the agents tab: `build-loop --goal "<the loop /goal line the tracker skill printed>"`.
- **Orchestrator**, in the agents tab and the repo's own checkout, with no worktree: `orchestrator [--prompt "<the line its starter gives>"]`; with none it lists the open tickets per the `tracker` skill and starts what is buildable.
- **Research**: `research --slug <slug> --topic "<topic>"`.
- **Plan**, new or resumed, and the one a build starts for a ticket it sends back, cuts or halts and for each idea or distraction it filed: `plan --ticket <n> --why "<one sentence>" --what "<one sentence>"`, or `plan --idea "<idea>"` for a new idea. The script refuses a ticket with no Why and What.
- **Question**, for one question of a builder: `question --builder <name> --k <k> --text "<the question, its options and the recommendation>"`.
- **Prototype**, of a ticket or an idea: `proto --ticket <n>` or `proto --slug <slug> --idea "<idea>"`.

### The screen

The agents tab, labelled `(agents)`, holds the orchestrator and the builders; plan, question, prototype and research sessions keep their own tabs.

- The orchestrator's pane is the first pane of the tab, and always the left column. Only the repo's own session, finding no `<repo>-orchestrator` in `herdr agent list`, or a blocked builder makes one: the repo's own session renames its own agent with `herdr agent rename <pane-id> <repo>-orchestrator`, and a builder starts one with the Orchestrator case.
- The builders fill the right column, stacked one above the other: split the first builder's pane `--direction right` from the orchestrator's pane, and each later builder's pane `--direction down` from the lowest builder pane.
- Start each agent in its new pane with step 4.

### The orchestrator

A session whose own agent, found in `herdr agent list` by `$HERDR_PANE_ID`, is named `<repo>-orchestrator` is the orchestrator.

- Start plan and build sessions per the cases, as the user asks or as the `tracker` skill's list shows.
- At the start of a batch, a `/goal` run, create `feature/<slug>` from `main` per the `tracker` skill, and name it in each builder's prompt.
- A message that starts `READY #<n>`: tell the user the PR, its branch and the three lines, and ask whether to merge it or everything in the batch. On everything, send `herdr agent prompt <builder> "GO-AHEAD <branch>"` to every builder of the batch; to withdraw it, send `STOP <branch>` the same way.
- When every ticket of a batch is in its feature branch, open the branch's PR into `main` per the `tracker` skill. When the user said "merge everything", merge that PR yourself and tell the user; otherwise tell the user and ask. A merge that deploys waits for the user's yes.
- Build, edit and review nothing.

## Do

- Start every session with `scripts/session.mjs`, which uses `scripts/lib/plan-session.mjs` for the case and `scripts/lib/herdr.mjs` to run herdr, never with a hand-typed `herdr tab create` or `herdr agent start`.
- Name every agent with the repo's name and a dash before its role: herdr agent names are unique across every workspace, and the script does it.
- Send `/compact` and `/goal clear` to a running agent with `herdr agent prompt`.
- Run `herdr pane move <pane_id> --tab <tab_id>` to relocate a stray running agent.

## Don't

- Don't run a bare `herdr worktree create --cwd <path>`.
- Don't start a plan session with a bare `/plan <n>`: it carries the ticket's Why and What.
- Don't send a `/goal` with `herdr agent prompt`.

## Glossary

- **Herdr** - the terminal workspace manager that holds a session's tabs.
- **Workspace** - Herdr's group of tabs; `$HERDR_WORKSPACE_ID` names the current one.
- **Pane** - one terminal inside a tab.
- **Agents tab** - the one tab per workspace that shows the orchestrator as the left column and the builders stacked one above the other on the right.
- **Pick** - the ticket the user chose to build or plan.
- **Question session** - a plan session a builder starts for one question; it files no ticket and answers the builder with `ANSWER <k>`.
- **Needs-planning handoff** - a ticket labelled `needs-planning`, opened as a plan session with `/plan <n>`.
- **`/goal`** - the line that sets a session's end condition.
