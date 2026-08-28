# Architecture

How the plugin works and where its seams are. `/grill` and `/build` read it whole; `/grill` adds the delta a ticket will bring, marked `pending #<n>`; the docs layer that delivers it marks the entry `done` and rewrites any seam the stack moved.

## The program

Two kinds of session, joined only by GitHub Issues and the board.

```text
planning session     /grill <idea>  →  docs written, ticket #n filed (ready, --blocked-by, priority)
build session        claude --worktree ticket-<n>
                     /tickets                 open tickets, blockers, priority; the /goal line for one
                     /goal <that line>        typed by you
                       /build <n>             claim → layer plan comment → per layer: tests red → code → /code-review medium → stacked PR
                                              docs layer last → every Done when case run, real output pasted
you                  review each PR, gh stack merge; the ticket closes on the last one
```

## How it runs

```text
build session
	/tickets
		gh issue list                      ready, open
		gh api .../dependencies/blocked_by  per ticket
	/goal <ticket #n is built: ...>        Haiku judges the condition after every turn
		/build <n>
			gh issue edit --add-assignee, board → In Progress
			gh issue comment                   the layer plan
			layer k                            loop
				Skill code-review              medium, once per layer
				gh stack init | add, submit    one draft PR per layer
			docs layer                         README, architecture done, product swept, examples re-run, roadmap Shipped
				Skill retro                    rule lines ride this PR
			run every Done when case           the judge reads the outputs
```

## Seams

- **Planning → build** - a ticket with label `ready` and every blocker closed. `/tickets` reads it; nothing else crosses.
- **Build → human** - a stack of draft PRs whose bodies follow the template; the last carries `Closes #<n>`. The human merges; nothing in the plugin merges.
- **Build → user, mid-build** - a missing ruling is an `AskUserQuestion` in the build session; the user is present.
- **Plugin → repo** - `templates/` installed by `init`; `CLAUDE.md` between markers is the plugin's, everything else in the repo is the repo's.

## Feature index

- **grill** - the interview; reads the three docs, writes settled decisions back, files the ticket, runs retro. `skills/grill/SKILL.md`. (done)
- **tickets** - lists open tickets with blockers and priority; prints the `/goal` line for one. `skills/tickets/SKILL.md`. (done)
- **build** - one ticket to one stack, layers chosen in the session, docs last; runs under the user's `/goal`. `skills/build/SKILL.md`. (done)
- **github** - every `gh` command the flow uses. `skills/github/SKILL.md`. (done)
- **retro** - corrections to rules, at two moments. `skills/retro/SKILL.md`. (done)
- **init** - `skills/init/SKILL.md`; the session installs `templates/` with its own tools: block replaced, other files created when absent, settings merged. (done)
- **output style** - `output-styles/outputty.md`, `force-for-plugin: true`. (done)
- **advisor** - `advisorModel: fable` in `templates/settings.json`; activates only when the advisor outranks the base model (`advisor_rank`, Fable 5 > Sonnet 5 > Haiku). `kind: limitation`; probe: `/advisor` shows "Advisor Tool (experimental) is on". (done)
- **/goal is typed by the user into the session that does the work** - no skill, agent or hook can set one, and its judge skips a turn while a background agent runs. `kind: limitation`; probe: goal.md "Background work defers evaluation". (done)
- **auto mode** - `permissions.defaultMode: auto` applies only from user or managed settings, never from a project file. `kind: limitation`; probe: permission-modes.md. (done)
- **gh stack init** - with a branch name that does not exist it branches from the default branch and drops local commits; adopt the current branch by name. `kind: limitation`; probe: `gh stack init --help`. (done)
