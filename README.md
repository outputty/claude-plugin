# outputty

This is my personal setup for developing projects with Claude Code. It is a plugin I install into every repo I work on. The idea: I decide what to build and I review what was built; everything in between runs on its own, on loops, through GitHub Issues.

## Two stages, both loops

**Planning** is a session I sit in. `/grill` interviews me about an idea until nothing answerable is left, shows me the interface options and the end state, and on my yes files one ticket on GitHub: the interface we agreed, numbered done-conditions, and `--blocked-by` for whatever must land first. I can run several planning sessions side by side; each ends with one ticket on the board and nothing else. The ticket carries no task breakdown; that is the builder's.

**Building** is one long-lived session I start and leave running on `/loop 10m`. Each tick fast-forwards the default branch, checks GitHub for the next ready ticket (label `ready`, no assignee, every blocker closed, `priority:high` first), and spawns a `build` agent for it, two at a time at most. The agent works in its own worktree on Sonnet with the Fable advisor: it posts its layer plan as a comment on the ticket, builds one layer at a time, runs `/code-review` once per layer, opens one stacked draft PR per layer, and writes the docs as the last layer. It ends with one line, `PR: <url>`, which the next tick relays.

**Me, in between:** I read the stack and merge it with `gh stack merge`; the ticket closes on the last PR. When an agent hits a ruling nobody made, it labels the ticket `needs-decision` with its question; I answer in a planning session and the loop picks it up again.

```text
planning session (attended, any number)     loop session (one, unattended)
  /grill <idea>                               /loop 10m
    docs written, ticket filed                  each tick: ff guard, next ready ticket, spawn build agent (≤2 live)
                                                  build agent → layer plan, one PR per layer, docs last
me: review, gh stack merge, answer needs-decision
```

## What is in the plugin

Five skills, one agent, and the files a repo needs. Everything else is a Claude Code built-in: `/loop`, `/code-review`, `/simplify`, worktrees, auto-memory, the advisor.

- **`/grill`** - the interview. Every answerable question in one numbered round, each with a recommendation; every premise grounded, absent, or spiked; every place the fix could land priced. On my yes it writes the docs, files the ticket and runs `retro`.
- **`/build <n>`** - one ticket to one stack. In the main session by hand, or as the `build` agent from the loop.
- **`github`** - the exact `gh` commands for tickets, dependencies, board moves, the next-ticket query, the fast-forward guard and stacked PRs. Loads itself when a task touches them.
- **`/retro`** - a correction becomes one line in `.claude/rules/<topic>.md`.
- **`/outputty:init`** - installs the templates.
- **`templates/`** - the managed CLAUDE.md block, three rules files, four product docs, `loop.md` (the tick), the ticket and PR templates, the settings (`advisorModel: fable`, `outputStyle: outputty`, secret-path denies).
- **`output-styles/outputty.md`** - my writing standard, applied whenever the plugin is enabled.

## The docs a repo keeps

Four files under `.claude/`, read whole, each with one writer, so the setup evolves with the repo:

1. **`product.md`** - North Star and Language. `/grill` writes a settled decision into it.
2. **`roadmap.md`** - why each open ticket is worth building now, and under Killed, what was rejected and why. `/grill` adds a paragraph; the docs layer moves it under Shipped.
3. **`architecture.md`** - the program, the call graph, the seams, the feature index. `/grill` adds a delta as `pending`; the docs layer marks it `done`.
4. **`examples.md`** - the canonical examples every done-condition and PR reuses.

Corrections go to `.claude/rules/` as one line each, at two moments: after `/grill` files, and inside every build's docs layer. Machine-level facts go to auto-memory. Nothing else remembers anything.

## Why an agent per ticket, and why `/loop`

The loop session runs for hours. A ticket built inside it would fill its context with files and test output that the next ticket does not need. An agent starts fresh with the ticket and the docs, edits its own worktree, runs on the cheaper model with the expensive one on call, and returns one line. `/loop` rather than `/goal`: a goal can only be typed by a person into the session that does the work, and its judge sleeps while agents run, so it fits one attended ticket, not a queue.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`. It installs the block, the rules, the docs, `loop.md`, the templates and the settings, then tells you to add the repo's check commands to the allowlist, create the three labels, and write the board ids into `CLAUDE.md`. Merge that PR before the first build.

Requirements: `gh` 2.96 or later, `gh extension install github/gh-stack` with stacked PRs enabled on the repo, a GitHub Project with a Status field, Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent).

## Safety

No hooks. The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`, and ask before `rm -rf` and `git clean -f`. The agent is capped at 200 turns, the loop spawns two at most, and nothing in the loop merges. Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the laziest-working-diff discipline, now in `.claude/rules/code.md`.
- grill-with-docs (Matt Pocock) - the interview `/grill` grew from.
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (MIT) - the action-first output rules in the output style.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/build` grew from.
