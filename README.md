# outputty

This is my personal setup for developing projects with Claude Code. It is a plugin I install into every repo I work on. The idea: I decide what to build and I review what was built; everything in between runs on its own, on loops, through GitHub Issues.

## Two stages, both loops

**Planning** is a session I sit in. `/grill` interviews me about an idea until nothing answerable is left, then `breakdown` files a parent issue and its sub-issues on GitHub, each sub-issue carrying numbered done-conditions that an agent can build cold. I can run several planning sessions side by side; each one ends with issues on the board and nothing else.

**Building** is one long-lived session that I start and leave running. It runs `/goal` with a condition over the board: no `ready` issue left unassigned. After each turn it pulls the default branch and checks GitHub again, so an issue I file from a planning session while it runs is picked up on the next turn. For each ready sub-issue it dispatches a `fix-issue` agent: Sonnet, its own worktree, the Fable advisor for the judgement calls, capped at 60 turns. The agent writes the tests, writes the code, runs `/code-review` once, and opens a draft PR. A `/goal` judge (Haiku) reads the transcript after every turn and decides whether the condition holds.

**Me, in between:** I review each PR and merge it with `gh stack merge`. When an agent hits a ruling nobody made, it labels the issue `needs-decision` with its question; I answer in a planning session and the build picks it up again.

```text
planning session (attended, any number)     build session (one, unattended)
  /grill <idea>                               /goal no ready issue is unassigned, or stop after 8h
  breakdown → parent + sub-issues, board        each turn: git pull, next ready sub-issue
                                                  fix-issue agent → tests, code, review, draft PR
me: review, gh stack merge, answer needs-decision
```

## What is in the plugin

Six skills, one agent, and the files a repo needs. Everything else is a Claude Code built-in: `/goal`, `/code-review`, `/simplify`, worktrees, auto-memory, the advisor.

- **`/grill`** - the interview. Every answerable question in one numbered round, each with a recommendation; every premise grounded, absent, or spiked. Hands over to `breakdown` on my yes.
- **`breakdown`** - plan mode over the code, then sub-issues with done-conditions and `--blocked-by` links, plus the roadmap paragraph and the architecture delta. One approval.
- **`/fix-issue <n>`** - one issue to one reviewed PR. In the main session by hand, or as the `fix-issue` agent from the build session.
- **`github`** - the exact `gh` commands for sub-issues, dependencies, board moves and stacked PRs. Loads itself when a task touches them.
- **`/retro`** - a correction becomes one line in `.claude/rules/<topic>.md`.
- **`/outputty:init`** - installs the templates.
- **`templates/`** - the managed CLAUDE.md block, three rules files, four product docs, the issue and PR templates, the settings (`advisorModel: fable`, `outputStyle: outputty`, secret-path denies).
- **`output-styles/outputty.md`** - my writing standard, applied whenever the plugin is enabled.

## The docs a repo keeps

Four files under `.claude/`, read whole, each with one writer, so the setup evolves with the repo:

1. **`product.md`** - North Star and Language. `/grill` writes a settled decision into it.
2. **`roadmap.md`** - why each open parent is worth building now. `breakdown` adds a paragraph; a merge moves it under Shipped.
3. **`architecture.md`** - the program, the call graph, the seams, the feature index. `breakdown` adds a delta as `pending`; the delivering PR marks it `done`.
4. **`examples.md`** - the canonical examples every done-condition and PR reuses.

Corrections go to `.claude/rules/` as one line each. Machine-level facts go to auto-memory. Nothing else remembers anything.

## Why an agent per issue

The build session runs for hours. An issue built inside it would fill its context with files and test output that the next issue does not need. An agent starts fresh with the issue and the architecture doc, edits its own worktree, runs on the cheaper model with the expensive one on call, and returns one line. `/fix-issue` is the same procedure; run it in the main session when you want to watch.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`. It installs the block, the rules, the docs, the templates and the settings, then tells you to add the repo's check commands to the allowlist, create the two labels, and write the board ids into `CLAUDE.md`. Merge that PR before the first build.

Requirements: `gh` 2.96 or later, `gh extension install github/gh-stack` with stacked PRs enabled on the repo, a GitHub Project with a Status field, Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent).

## Safety

No hooks. The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`, and ask before `rm -rf` and `git clean -f`. The agent is capped at 60 turns, the goal carries a time clause, and nothing in the loop merges. Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the laziest-working-diff discipline, now in `.claude/rules/code.md`.
- grill-with-docs (Matt Pocock) - the interview `/grill` grew from.
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (MIT) - the action-first output rules in the output style.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/fix-issue` follows.
