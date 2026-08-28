# Architecture

How the plugin works and where its seams are. `/grill` and `build` read it whole; `/grill` adds the delta a ticket will bring, marked `pending #<n>`; the docs layer that delivers it marks the entry `done` and rewrites any seam the stack moved.

## The program

Two sessions, joined only by GitHub Issues and the board.

```text
planning session          /grill <idea>  →  docs written, ticket #n filed (ready, --blocked-by, priority)
loop session              /loop 10m                        each tick: .claude/loop.md
  tick                    ff guard; release dead agents; spawn build agents up to 2 live
    build agent           claim → In Progress → layer plan comment → per layer: tests red → code → /code-review medium → stacked PR
                          docs layer last → PR: <bottom url>   |   PR: none - <reason> + needs-decision
you                       review each PR, gh stack merge; the ticket closes on the last one
```

## How it runs

```text
loop session
	/loop 10m                          scheduled prompt = .claude/loop.md
		git fetch / merge --ff-only        refused or dirty → tick ends
		gh issue edit --remove-assignee    dead agent: In Progress, no PR, 90 min
		gh issue list                      ready, no assignee, blockers closed, priority:high first
		Agent build <n>                    Sonnet, isolation: worktree, maxTurns 200, advisor Fable
			gh issue edit --add-assignee, board → In Progress
			gh issue comment                   the layer plan
			layer k                            loop
				Skill code-review              medium, once per layer
				gh stack init | add, submit    one draft PR per layer
			docs layer                         README, architecture done, product swept, examples re-run, roadmap Shipped
				Skill retro                    rule lines ride this PR
```

## Seams

- **Planning → loop** - a ticket with label `ready`, no assignee, every blocker closed. Nothing else crosses.
- **Loop → agent** - the ticket number, nothing more. The agent reads the ticket and the docs itself.
- **Agent → human** - a stack of draft PRs whose bodies follow the template; the last carries `Closes #<n>`. The human merges; nothing in the loop merges.
- **Agent → planning** - the `needs-decision` label plus a comment holding the one ruling needed. Planning answers in a comment and removes the label.
- **Plugin → repo** - `templates/` installed by `init`; `CLAUDE.md` between markers is the plugin's, everything else in the repo is the repo's.

## Feature index

- **grill** - the interview; reads the three docs, writes settled decisions back, files the ticket, runs retro. `skills/grill/SKILL.md`. (done)
- **build** - one ticket to one stack, layers chosen by the agent, docs last; the agent in `agents/build.md` runs it on Sonnet with the Fable advisor. (done)
- **loop.md** - the tick `/loop` runs: guard, release, spawn up to two. `templates/loop.md`. (done)
- **github** - every `gh` command the loop uses. `skills/github/SKILL.md`. (done)
- **retro** - corrections to rules, at two moments. `skills/retro/SKILL.md`. (done)
- **init** - `skills/init/SKILL.md`; the session installs `templates/` with its own tools: block replaced, other files created when absent, settings merged. (done)
- **output style** - `output-styles/outputty.md`, `force-for-plugin: true`. (done)
- **advisor** - `advisorModel: fable` in `templates/settings.json`; activates only when the advisor outranks the base model (`advisor_rank`, Fable 5 > Sonnet 5 > Haiku). `kind: limitation`; probe: `/advisor` shows "Advisor Tool (experimental) is on". (done)
- **/goal is typed, never set by a skill or agent** - it installs a session-scoped Stop hook from the interactive command only, and its judge skips turns while a background agent runs. `kind: limitation`; probe: goal.md "Background work defers evaluation". This is why the loop session uses `/loop`, not `/goal`. (done)
- **auto mode** - `permissions.defaultMode: auto` applies only from user or managed settings, never from a project file. `kind: limitation`; probe: permission-modes.md. (done)
- **gh stack init** - with a branch name that does not exist it branches from the default branch and drops local commits; adopt the current branch by name. `kind: limitation`; probe: `gh stack init --help`. (done)
- **/loop prompt** - a bare `/loop` runs `.claude/loop.md` when present; a scheduled fire runs only skills Claude may invoke on its own, and built-in commands in the prompt reach Claude as text. `kind: limitation`; probe: scheduled-tasks.md. (done)
