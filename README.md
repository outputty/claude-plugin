# outputty

outputty is a Claude Code plugin that carries an idea to a merged pull request through GitHub Issues.
A planning session interviews you and files one parent issue with buildable sub-issues. A build
session runs `/goal` over them and dispatches one agent per sub-issue, each opening its own PR. You
review and merge.

It ships six skills (`grill`, `breakdown`, `fix-issue`, `retro`, `github`, `init`), one agent, and the
files a repo needs to run the loop. Everything else is a
Claude Code built-in: `/goal`, `/code-review`, `/simplify`, worktrees, auto-memory, the advisor.

## Requirements

1. **git**, a GitHub remote, and an authenticated `gh` 2.96 or later (`--parent` and `--blocked-by`
   on `gh issue create`).
2. **`gh stack`** - `gh extension install github/gh-stack`. Stacked pull requests are in public
   preview; enable them on the repository.
3. **Claude Code 2.1.247 or later**, on a plan with Fable access if you want the advisor.
4. **A GitHub Project (v2)** with a Status field. The defaults `Todo`, `In Progress`, `Done` are
   enough.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then, inside the repo, once:

```text
/outputty:init
```

It copies the managed `CLAUDE.md` block, `.claude/rules/`, the issue and PR templates, and the
settings into the checkout, and tells you to add the repo's test and lint commands to the allowlist
and the board ids to `CLAUDE.md`. Merge that PR before the first build; a worktree only sees what its
base commit carries.

To update: `claude plugin marketplace update outputty`, then `claude plugin update outputty@outputty`,
then `/reload-plugins`.

## The loop

```text
planning session (attended, any number in parallel)
  /grill <idea>              rounds over the answerable frontier, premises verdicted, spikes as forks
  /breakdown                 parent issue + one sub-issue per unit, --parent, --blocked-by, board Todo

build session (one, long-lived)
  /goal every sub-issue of #N is closed or carries needs-decision, or stop after 8 hours
    each turn               oldest unblocked open sub-issue with no assignee
    Agent fix-issue          Sonnet + Fable advisor, own worktree, 60 turns
      claim → In Progress → tests red → code → /code-review medium → gh stack submit
      ends: PR: <url>   or   PR: none - <reason>, label needs-decision

you
  review each PR, gh stack merge <pr>, the issue closes, the board moves to Done
  answer a needs-decision comment in a planning session, remove the label
```

The `/goal` judge is Haiku; it reads the transcript after every turn and decides `met`, `not met`
or `impossible`. It runs no tools, so a sub-issue's **Done when** cases are commands whose output the
agent prints.

### A sub-issue

`/breakdown` files each one from `.github/ISSUE_TEMPLATE/task.md`:

```markdown
## Done when

1. `bun test test/export` prints `3 passed`
2. `bun run cli export --format csv fixtures/orders.json` prints a header line and 2 rows
3. No file outside `src/export` changed
```

### A correction

A correction becomes one line in `.claude/rules/<topic>.md` the same day, and `/retro` finds the ones
a session forgot:

```markdown
- After a rename, git grep prose and comments for the old name before the commit. (2026-08-28)
```

## What is in the box

- **`/grill`** - the interview. Whole frontier per round, each question with a recommendation; every
  premise grounded, absent, or spiked.
- **`/breakdown`** - plan mode over the code, then sub-issues with numbered done-conditions and
  dependency links. One approval.
- **`/fix-issue <n>`** - one issue to one reviewed PR. The `fix-issue` agent runs it unattended.
- **`/retro`** - corrections to rules, each to the one file that loads it next time.
- **`github`** - the exact `gh` commands for sub-issues, dependencies, board moves and stacked PRs.
  Loads itself whenever a task touches them; the board ids come from CLAUDE.md.
- **`/outputty:init`** - the installer.
- **`templates/`** - what `init` copies: the CLAUDE.md block, three rules files, two templates, the
  settings (`advisorModel: fable`, secret-path denies).
- **`output-styles/outputty.md`** - the writing standard, applied whenever the plugin is enabled.

## Advisor

`templates/settings.json` sets `advisorModel: fable`. The advisor is a server-side tool: the worker
model forwards its whole transcript and gets a ruling back. It activates only when the advisor
outranks the base model (Fable 5 above Sonnet 5), which is why the `fix-issue` agent pins
`model: sonnet`. Fable as advisor bills to usage credits; run `/model fable` once to consent, and
`/advisor` to check or change it.

## Safety

The plugin ships no hooks. `templates/settings.json` denies `Read`, `Edit` and `Write` on `.env`,
`.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`, and asks before `rm -rf` and
`git clean -f`. Permission mode is yours: `auto` applies only from `~/.claude/settings.json`. The
`fix-issue` agent is capped at 60 turns; the `/goal` condition carries its own time clause. Details in
[`docs/security.md`](docs/security.md).

## Credits

- **[ponytail](https://github.com/DietrichGebert/ponytail)** (Dietrich Gebert) - the laziest-working-diff
  discipline, now in `.claude/rules/code.md`.
- **grill-with-docs** (Matt Pocock) - the interview `/grill` grew from.
- **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (MIT) - the action-first output rules
  in the output style.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which
  `/fix-issue` follows.
