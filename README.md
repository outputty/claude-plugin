# outputty

This is my personal setup for developing projects with Claude Code. It is a plugin I install into every repo I work on. The idea: I decide what to build, I pick what gets built next, and I review what was built; everything in between runs on rules.

## Two kinds of session

**Planning** is a session I sit in. `/grill` interviews me about an idea until nothing answerable is left, shows me the interface options and the end state, and on my yes files one ticket on GitHub: the interface we agreed, numbered done-conditions, and `--blocked-by` for whatever must land first. I can run several planning sessions side by side; each ends with one ticket on the board and nothing else. The ticket carries no task breakdown; that is the builder's.

**Building** is a session I start by hand on its own worktree. `/tickets` lists what is open with blockers and priority and prints the `/goal` line for the one to build. I paste it, and the session works the ticket under that goal: it posts its layer plan as a comment, builds one layer at a time, runs `/code-review` once per layer, opens one stacked draft PR per layer, writes the docs as the last layer, then runs every done-condition and pastes the real output. The `/goal` judge reads those outputs after each turn. When a ruling is missing, the session asks me; I am there.

**Me, in between:** I read the stack and merge it with `gh stack merge`; the ticket closes on the last PR.

```text
planning session (attended, any number)     build session (attended, one ticket)
  /grill <idea>                               claude --worktree ticket-<n>
    docs written, ticket filed                /tickets → the /goal line → paste
                                              /build: layer plan, one PR per layer, docs last
me: review, gh stack merge
```

## What is in the plugin

Six skills and the files a repo needs. Everything else is a Claude Code built-in: `/goal`, `/code-review`, `/simplify`, worktrees, auto-memory, the advisor.

- **`/grill`** - the interview. Every answerable question in one numbered round, each with a recommendation; every premise grounded, absent, or spiked; every place the fix could land priced. On my yes it writes the docs, files the ticket and runs `retro`.
- **`/tickets`** - the open tickets with blockers and priority, and the `/goal` line for one.
- **`/build <n>`** - one ticket to one stack, under the goal.
- **`github`** - the exact `gh` commands for tickets, dependencies, board moves and stacked PRs. Loads itself when a task touches them.
- **`/retro`** - a correction becomes one line in `.claude/rules/<topic>.md`.
- **`/outputty:init`** - installs the templates.
- **`templates/`** - the managed CLAUDE.md block, three rules files, four product docs, the ticket and PR templates, the settings (`advisorModel: fable`, `outputStyle: outputty`, secret-path denies).
- **`output-styles/outputty.md`** - my writing standard, applied whenever the plugin is enabled.

## The docs a repo keeps

Four files under `.claude/`, read whole, each with one writer, so the setup evolves with the repo:

1. **`product.md`** - North Star and Language. `/grill` writes a settled decision into it.
2. **`roadmap.md`** - why each open ticket is worth building now, and under Killed, what was rejected and why. `/grill` adds a paragraph; the docs layer moves it under Shipped.
3. **`architecture.md`** - the program, the call graph, the seams, the feature index. `/grill` adds a delta as `pending`; the docs layer marks it `done`.
4. **`examples.md`** - the canonical examples every done-condition and PR reuses.

Corrections go to `.claude/rules/` as one line each, at two moments: after `/grill` files, and inside every build's docs layer. Machine-level facts go to auto-memory. Nothing else remembers anything.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`. It installs the block, the rules, the docs, the templates and the settings, then tells you to add the repo's check commands to the allowlist, create the two labels, and write the board ids into `CLAUDE.md`.

Requirements: `gh` 2.96 or later, `gh extension install github/gh-stack` with stacked PRs enabled on the repo, a GitHub Project with a Status field, Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent).

## Safety

No hooks. The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`, and ask before `rm -rf` and `git clean -f`. The goal line carries its own turn cap, and nothing in the plugin merges. Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the laziest-working-diff discipline, now in `.claude/rules/code.md`.
- grill-with-docs (Matt Pocock) - the interview `/grill` grew from.
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (MIT) - the action-first output rules in the output style.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/build` grew from.
