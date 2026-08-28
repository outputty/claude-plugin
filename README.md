# outputty

This is my personal setup for developing projects with Claude Code, meant to be used together with [Herdr](https://herdr.dev), the terminal workspace manager for coding agents. It is a scaffold: one command copies it into a repo, and the repo owns and edits its copy from then on.

Herdr is what makes the sessions cheap to run side by side: every plan and every build opens as a new tab in the current workspace, next to the session that picked it, with `claude --worktree` started on the right model and the prompt already sent. Without Herdr the same flow works by hand, one `claude --worktree` per session.

The idea: I decide what to build, I pick what gets built next, and I review what was built. Everything in between runs on rules.

## Two kinds of session

**Planning** is a session I sit in.

- `/plan` interviews me about an idea until nothing answerable is left.
- It spikes the fix where it shows and one level up, prices both, and takes my pick.
- On my yes it files one ticket: the interface we agreed, numbered done-conditions, and what must land first.
- Everything the session learns goes to a scratch file outside the repo, so a restarted session resumes instead of asking again.
- Several planning sessions can run side by side; each ends with one ticket and nothing else. The ticket carries no task breakdown; that is the builder's.
- A build that hits a design question sends the ticket back with `needs-planning`, and `/plan <n>` reopens it.

**Building** is a session on its own worktree, on Sonnet.

- `/tickets` in my primary session lists what is open with blockers and priority, and prints the `/goal` line for the one to build.
- On my pick it opens the session: inside Herdr, a new tab alongside with `claude --worktree ticket-<n> --model sonnet` started and the goal line sent; outside Herdr, the `claude --worktree` command for me to run.
- A `needs-planning` pick opens a planning tab the same way, on the default model, with `/plan <n>` sent. The primary session never plans or builds inline.
- Under that goal the session posts its layer plan as a comment on the ticket, builds one layer at a time, runs `/code-review` once per layer, and opens one stacked draft PR per layer.
- The docs are the last layer, written when the final output is known.
- It runs every done-condition and pastes the real output; the `/goal` judge reads those outputs after each turn.
- When a ruling is missing, the session asks me. I am there.

**Me, in between:** I read the stack and merge it. The ticket closes on the last PR.

```text
primary session (Herdr workspace root, on main)
  /tickets → pick → herdr tab create + herdr agent start (claude --worktree) + herdr agent prompt

planning tab (default model)                build tab (Sonnet, Fable advising)
  /plan <idea> or /plan <n>                  /goal … by following /build <n>
    docs written, ticket filed, PR opened      layer plan, one PR per layer, docs last
me: review, merge
```

Model policy: planning on the default model, because its judgement calls are the expensive part; builds on Sonnet, because the layers are mechanical once planned; Fable as the advisor in both, from the repo settings.

## What the scaffold copies, and where

The plugin itself is only `/outputty:init`. It copies at two levels: what is the same in every repo goes once under `~/.claude/` and reaches every session on the machine; what is the repo's goes under the repo's `.claude/`. Both are the owner's to edit.

User level, `~/.claude/`, about how I work: the four flow skills, the tracker, the three rule files, the output style, the expert-skill template, and every expert skill. Repo level, the outputs about this repo: the four docs, rules true here only, the templates, the settings, the block with the board ids.

`init` asks two things that decide the split: which tracker I use (once per machine), and, for every repo-level file an earlier scaffold left behind, whether it moves to `~/.claude/` or stays. `retro` asks the same per lesson: every repo, or this one.

- **`~/.claude/skills/plan`** - the interview: every answerable question in one numbered round with a recommendation, every premise grounded, absent or spiked, every level the fix could land at priced. On my yes it writes the docs, files the ticket, offers to improve or create expert skills, and runs `retro`.
- **`~/.claude/skills/tickets`** - the open tickets with blockers and priority, the `/goal` line for one, and the handoff.
- **`~/.claude/skills/herdr`** - how a session is opened inside Herdr: a new tab in the current workspace, `claude --worktree` started in it on the right model, the prompt sent; the plan case and the build case; the workspace and pane traps.
- **`~/.claude/skills/build`** - one ticket to one stack, under the goal.
- **`~/.claude/skills/tracker`** - the exact commands for listing, reading and creating tickets, dependencies, board moves and stacked PRs, under a fixed set of headings. The shipped copy is GitHub Issues with `gh`; on Linear or another tracker the commands are rewritten under the same headings, once per machine, and nothing else changes. `plan`, `tickets` and `build` name no tracker.
- **`~/.claude/skills/retro`** - a correction becomes one line in `.claude/rules/<topic>.md`.
- **`~/.claude/output-styles/outputty.md`** - my writing standard, turned on once by `outputStyle` in `~/.claude/settings.json`.
- **`~/.claude/rules/`** - the three shared rule files, mine in every repo; **`.claude/rules/`** - rules true in this repo only. Per-language rules are added with `paths:` at either level as they are learned.
- **`.claude/{product,roadmap,architecture,examples}.md`** - the four product docs, filled with me at init.
- **`~/.claude/skill-template.md`** - the shape of an expert skill.
- **`.github/`** - the ticket and PR templates.
- **`.claude/settings.json`** - `advisorModel: fable`, secret-path denies.

## The docs a repo keeps

Four files under `.claude/`, read whole, each with one writer, so the setup evolves with the repo:

1. **`product.md`** - North Star and Language. `/plan` writes a settled decision into it.
2. **`roadmap.md`** - why each open ticket is worth building now, and under Killed, what was rejected and why. `/plan` adds a paragraph; the docs layer moves it under Shipped.
3. **`architecture.md`** - the stack, how components connect, interfaces and overrides, the principles a change follows, and the end-to-end pipeline every ticket and PR is written towards; high level, no low-level examples. `/plan` changes it as `pending`; the docs layer marks it `done`.
4. **`examples.md`** - the canonical examples every done-condition and PR reuses.

Corrections become one rule line each, at two moments: after `/plan` files, and inside every build's docs layer. `retro` asks per lesson whether it holds in every repo (`~/.claude/rules/`) or this one (`.claude/rules/`). A rule that applies everywhere sits in a shared file; one about a language or folder sits in its own file with `paths:` and loads only when a matching file is read.

Domain knowledge that is true beyond the repo becomes one expert skill per tool, vendor or discipline under `~/.claude/skills/<domain>/`: a short body that loads when a ticket names the domain, and `references/` read on demand. `init` finds the candidates in its sweep and I pick the domains with a multi-select question. `/plan` loads the expert before researching its domain, and at its end asks me, per domain, whether to improve the existing skill or create one; a disproven claim stays on record under Disproven.

Machine-level facts go to auto-memory. Nothing else remembers anything.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`.

- It copies the flow skills, the tracker, the rule files, the output style and the expert template under `~/.claude/`, once per machine, and the docs, the templates and the settings into the repo. A file already present at either level is kept, and its drift from the scaffold is reported.
- It asks which tracker I use, once per machine, and rewrites the `tracker` skill with me when it is not GitHub.
- It finds repo-level copies an earlier scaffold left (skills, rules, the output style) and asks, per file, whether each moves to `~/.claude/` or stays.
- It reads the repo with one agent per source: docs wherever they live, code, git history, existing instruction files.
- It fills the four product docs one at a time: a draft with every claim cited, a numbered round of questions with recommendations, my answers, the file written. An existing doc in another shape is mapped into the new sections; what does not fit is asked about, not dropped.
- Standing rules found in old files become candidate lines in `.claude/rules/`, keep or drop per line.
- Domain knowledge becomes expert skills for the domains I select.
- It ends by adding the repo's check commands to the allowlist, creating the tracker's labels, writing the board ids into `CLAUDE.md`, and opening the PR.

Re-running `/outputty:init` after a scaffold upgrade prints, per file, `unchanged` or `kept, differs from <template>`; taking the diff is the repo's call, file by file.

Requirements: Herdr on `PATH` (`herdr` with `HERDR_ENV=1` inside its session; the flow degrades to hand-run `claude --worktree` without it), Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent). For the shipped GitHub tracker: `gh` 2.96 or later, `gh extension install github/gh-stack` with stacked PRs enabled on the repo, and a GitHub Project with a Status field.

## Safety

No hooks.

- The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`.
- They ask before `rm -rf` and `git clean -f`.
- The goal line carries its own turn cap, and nothing in the scaffold merges.

Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the laziest-working-diff discipline, now in `.claude/rules/code.md`.
- grill-with-docs (Matt Pocock) - the interview `/plan` grew from.
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (MIT) - the action-first output rules in the output style.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/build` grew from.
