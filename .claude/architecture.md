# Architecture

How the plugin works and where its seams are. `/grill` and `fix-issue` read it whole; `breakdown` adds the delta a parent will bring, marked `pending #<parent>`; the PR that delivers it marks the entry `done` and rewrites any seam the diff moved.

## The program

Two sessions, joined only by GitHub Issues and the board.

```text
planning session          /grill <idea>  →  breakdown          parent #N, sub-issues, board Todo
build session             /goal no open issue carries the ready label ..., or stop after 8 hours
  each turn               git pull; oldest unblocked ready sub-issue with no assignee
                          Agent { subagent_type: "fix-issue", prompt: "<n>" }
    fix-issue agent       claim → In Progress → tests red → code → /code-review medium → gh stack submit
                          PR: <url>   |   PR: none - <reason> + needs-decision
you                       review, gh stack merge <pr>; the issue closes, the board moves to Done
```

## How it runs

```text
build session
	/goal                          Haiku judges the condition after every turn
		gh issue list                  --label ready, no assignee, blockers closed
		Agent fix-issue                Sonnet, isolation: worktree, maxTurns 60, advisor: Fable
			gh issue edit                  --add-assignee, board In Progress
			Skill code-review              medium, once
			gh stack init / submit         one PR, draft
		gh issue edit                  --remove-assignee on a dead agent (In Progress, no PR, 90 min)
```

## Seams

- **Planning → build** - a sub-issue on the board with label `ready`, no assignee, all blockers closed. Nothing else crosses.
- **Build → human** - a draft PR whose body follows the template and carries `Closes #<n>`. The human merges; nothing in the loop merges.
- **Agent → planning** - the `needs-decision` label plus a comment holding the one ruling needed. Planning answers in a comment and removes the label.
- **Plugin → repo** - `templates/` installed by `init`; `CLAUDE.md` between markers is the plugin's, everything else in the repo is the repo's.

## Feature index

- **grill** - the interview; reads the three docs, writes settled decisions back. `skills/grill/SKILL.md`. (done)
- **breakdown** - plan mode → sub-issues with done-conditions, deps, board add, roadmap and architecture delta. `skills/breakdown/SKILL.md`. (done)
- **fix-issue** - one issue to one PR; the agent in `agents/fix-issue.md` runs it on Sonnet with the Fable advisor. (done)
- **github** - every `gh` command the loop uses. `skills/github/SKILL.md`. (done)
- **retro** - corrections to rules. `skills/retro/SKILL.md`. (done)
- **init** - `skills/init/install.mjs`; block replaced, other files created-if-absent, settings merged. (done)
- **output style** - `output-styles/outputty.md`, `force-for-plugin: true`. (done)
- **advisor** - `advisorModel: fable` in `templates/settings.json`; activates only when the advisor outranks the base model (`advisor_rank`, Fable 5 > Sonnet 5 > Haiku). `kind: limitation`; probe: `/advisor` shows "Advisor Tool (experimental) is on". (done)
- **auto mode** - `permissions.defaultMode: auto` applies only from user or managed settings, never from a project file. `kind: limitation`; probe: permission-modes.md. (done)
- **gh stack init** - with a branch name that does not exist it branches from the default branch and drops local commits; adopt the current branch by name. `kind: limitation`; probe: `gh stack init --help`. (done)
