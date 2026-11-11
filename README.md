# outputty

This is my personal setup for developing projects with Claude Code, meant to be used together with [Herdr](https://herdr.dev), the terminal workspace manager for coding agents. It is a scaffold: one command copies it into a repo, and the repo owns and edits its copy from then on.

Herdr is what makes the sessions cheap to run side by side: every plan, prototype and build opens as a new tab in the current workspace, next to the session that picked it, with `claude --worktree` started on the right model and the prompt already sent. Without Herdr the same flow works by hand, one `claude --worktree` per session.

The idea: I decide what to build, I pick what gets built next, and I review what was built. Everything in between runs on rules.

## The sessions

**Planning** is a session I sit in.

- `/plan` interviews me about an idea until nothing answerable is left.
- It spikes the fix where it shows and one level up, lists what each one changes and breaks, and takes my pick.
- On my yes it files one ticket: the interface we agreed, Implementation criteria, and what must land first.
- Everything the session learns goes to a scratch file outside the repo, so a restarted session resumes instead of asking again.
- Several planning sessions can run side by side; each ends with one ticket and nothing else. The ticket carries no task breakdown; that is the builder's.
- A build that hits a design question sends the ticket back with `needs-planning`, and `/plan <n>` reopens it.

**Prototyping** is a session on its own worktree, on Haiku, when I want to see it working before I settle it.

- `/prototype <idea>` or `/prototype <n>` opens in its own tab, writes a test for every requirement first, then wires the fastest path through patterns the repo already has.
- Anything that needs a new concept is stubbed with `TODO: stub`, so I see the whole flow working.
- The work stays on a local `prototype/<name>` branch: `/plan` reads it for an idea, and `/build` continues it, keeps its tests and replaces every stub.

**Building** is a session on its own worktree, on Sonnet.

- `/tickets` in my primary session lists what is open with blockers and priority, and prints the `/goal` line for the one to build.
- On my pick it opens the session: inside Herdr, a new tab alongside with `claude --worktree ticket-<n> --model sonnet` started and the goal line sent; outside Herdr, the `claude --worktree` command for me to run.
- A `needs-planning` pick opens a planning tab the same way, on Opus 5.5 (`--model claude-opus-5-5`), with `/plan <n>` sent. The primary session plans or builds inline only when I say "do it here".
- Under that goal the session posts its layer plan as a comment on the ticket, builds one layer at a time onto the ticket's one PR, ready for review, and runs one `/code-review` over the whole build at the end. A ticket I labelled `stack` while planning gets one stacked PR per layer instead.
- The docs are the last layer, written when the final output is known.
- It runs every Implementation-criteria case and pastes the real output; the `/goal` judge reads those outputs after each turn.
- It publishes a build-story `Artifact` tracking the whole build, one section per layer, republished as each layer lands - I can watch it without waiting for the PR.
- When a ruling is missing, the session asks me. I am there.

**Me, in between:** I read the PR and type "merge". The ticket closes on it.

```text
primary session (Herdr workspace root, on main)
  /tickets → pick → herdr tab create + herdr agent start (claude --worktree) + herdr agent prompt

planning tab (Opus 5.5)                     build tab (Sonnet, Fable advising)
  /plan <idea> or /plan <n>                  /goal … by following /build <n>
    docs written, ticket filed, PR opened      layer plan, one PR, docs last

prototype tab (Haiku), optional
  /prototype <idea> or /prototype <n>
    tests first, existing patterns, stubs → local prototype/<name>, read by /plan or continued by /build
me: review, merge
```

Model policy: planning on Opus 5.5, pinned by id, because its judgement calls are the expensive part; prototypes on Haiku, because they only reuse and stub; builds on Sonnet, because the layers are mechanical once planned; the advisor is whatever `advisorModel` your own `~/.claude/settings.json` sets; the repo settings never pin one.

## What the scaffold copies, and where

The plugin itself is `/outputty:init`, a SessionStart hook and an output style. The hook prints `hooks/context.md`, the standing lines, into every session, and the style is forced while the plugin is enabled; an upgrade reaches every session, and neither is copied. `/outputty:init` copies the rest at two levels: what is the same in every repo goes once under `~/.claude/` and reaches every session on the machine; what is the repo's goes under the repo's `.claude/`. Both are the owner's to edit.

User level, `~/.claude/`, about how I work: the flow skills, the tracker, the domain skills, and the skill and README templates. Repo level, the outputs about this repo: rules true here only, the templates, the settings, and the repo's `CLAUDE.md`.

`init` asks two things that decide the split: which tracker I use (once per machine), and, for every repo-level file an earlier scaffold left behind, whether it moves to `~/.claude/` or stays.

- **`~/.claude/skills/plan`** - the interview: every answerable question in one numbered round with a recommendation, every premise grounded, absent or spiked, every level the fix could land at shown with what it changes and breaks. It edits nothing and files nothing until I say go; at go it writes one record of the discussion, files the ticket with the grade of finish I asked for and the `stack` label only when I asked for a stack, and never widens the scope: a widening is offered as its own ticket. A spike that is already the complete fix offers a fast-path fix: build it now, or file it for a separate build.
- **`~/.claude/skills/prototype`** - an idea or a ticket seen working cheaply, on Haiku: tests first, existing patterns only, new concepts stubbed, kept on a local branch for `/plan` or `/build`.
- **`~/.claude/skills/tickets`** - the open tickets with blockers and priority, the `/goal` line for one, and the handoff.
- **`~/.claude/skills/herdr`** - how a session is opened inside Herdr: a new tab in the current workspace, `claude --worktree` started in it on the right model, the prompt sent; the plan, prototype and build cases; the workspace and pane traps.
- **`~/.claude/skills/build`** - one ticket to one PR, or to a stack when I labelled it `stack`, under the goal.
- **`~/.claude/skills/tracker`** - the exact commands for listing, reading and creating tickets, dependencies, board moves, a ticket's PR and stacked PRs, under a fixed set of headings. The shipped copy is GitHub Issues with `gh`; on Linear or another tracker the commands are rewritten under the same headings, once per machine, and nothing else changes. `plan`, `tickets` and `build` name no tracker.
- **`~/.claude/skills/retro`** - on my request, after a build or any time: I pick the sessions to read, and each correction I repeat becomes something that fails when the mistake returns: a lint rule with a probe test, a reproducing test, a Language line, a hook or permission, or an output-style line.
- **`~/.claude/skills/{data-engineering,frontend,typescript-node}`** - precise, verified traps per domain, grouped by problem: loads, staging, MERGE races and cross-engine hashing; hydration, TanStack Table v9 and shadcn recipes; exhaustive matching, dual ESM/CJS builds, Bun vs Node and node:cluster. Each loads only when a task touches its domain.
- **`~/.claude/skills/documentation`** - classifies content by Diátaxis (tutorial, how-to, reference, explanation) before writing it, then writes or rewrites a README or project doc against `~/.claude/readme-template.md`'s spine, de-slopping one that reads AI-generated. The build skill's docs layer invokes it.
- **`output-styles/outputty.md`**, in the plugin - how replies look: an end-to-end example, a call-stack graph or tree, few words. Forced while the plugin is enabled. A repo that sets `"outputty@outputty": false` in its `.claude/settings.json` turns the plugin off there, style and standing lines together.
- **`hooks/context.md`**, in the plugin - the standing lines, printed into every session by a SessionStart hook: the plan/prototype/build tab gate, code, test, docstring and comment rules. A line in your own `CLAUDE.md` wins where it disagrees. **`~/.claude/rules/typescript.md`** - TypeScript rules, loaded only for `.ts` files; **`.claude/rules/`** - rules true in this repo only.
- **`CLAUDE.md`** - the repo's minimal alignment document, drafted with me at init: what the project is, where each kind of file lives, the Language terms and the tracker ids.
- **`~/.claude/skill-template.md`** - the shape of a new domain skill, written only on request.
- **`~/.claude/readme-template.md`** - the shape of a README: spine, fence tags, API-bullet format.
- **`.github/`** - the ticket and PR templates.
- **`.claude/settings.json`** - secret-path denies and a deny on `ScheduleWakeup`; it pins no `advisorModel`, so your own global one stays.

## Where a repo keeps things

The plugin names no layout. Each repo's `CLAUDE.md` holds a section, drafted with me at init, that says where each kind of knowledge lives. A repo that follows the shape of my own:

1. **Tests** - the behaviour.
2. **The linter** - the rules a tool can hold.
3. **`.claude/rules/`** - the judgement a tool cannot hold.
4. **`README.md`** - the front door.
5. **`docs/<name>.md`** - what a user relies on.
6. **`docs/<name>.todo.md`** - what is not built yet.
7. **Issues in the tracker** - the plan.

Each doc holds current state only; the commit history and closed issues hold history. A correction I repeat becomes a check through `retro`, never a written lesson.

A domain skill under `~/.claude/skills/<domain>/` is written only when I ask for one, from `~/.claude/skill-template.md`.

Machine-level facts go to auto-memory. Nothing else remembers anything.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`.

- It copies the flow skills, the tracker and the skill template under `~/.claude/`, once per machine, and the templates and the settings into the repo. A file already present at either level is kept, and its drift from the scaffold is reported.
- On a machine an older init set up, it removes what the plugin now supplies: the outputty lines merged into `~/.claude/CLAUDE.md`, the copied `~/.claude/output-styles/outputty.md` and the `outputStyle` key. It shows me the diff and writes only on my yes.
- It asks which tracker I use, once per machine, and rewrites the `tracker` skill with me when it is not GitHub.
- It finds repo-level copies an earlier scaffold left (skills, rules, the output style) and asks, per file, whether each moves to `~/.claude/` or stays.
- It reads the repo with one agent per source: docs wherever they live, code, git history, existing instruction files.
- It drafts the repo's `CLAUDE.md` with me: what the project is, where each kind of file lives, the Language terms. It removes the flow and standing rules an older init merged into the file, shows me the diff, and writes only on my yes.
- Repo-only rules found in old files become one line each in `.claude/rules/`.
- It ends by adding the repo's check commands to the allowlist, creating the tracker's labels, writing the board ids into the **This repo** section of `CLAUDE.md`, and opening the PR.

Re-running `/outputty:init` after a scaffold upgrade prints, per file, `unchanged` or `kept, differs from <template>`; taking the diff is the repo's call, file by file.

Requirements: Herdr on `PATH` (`herdr` with `HERDR_ENV=1` inside its session; the flow degrades to hand-run `claude --worktree` without it), Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent). For the shipped GitHub tracker: `gh` 2.96 or later and a GitHub Project with a Status field; for a ticket labelled `stack`, also `gh extension install github/gh-stack` with stacked PRs enabled on the repo.

## Safety

No hooks. One `permissions.deny` entry blocks `ScheduleWakeup`.

- The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`, and reads of `plans/**`: the plan records `/plan` writes for me, which no session reads back.
- They ask before `rm -rf` and `git clean -f`.
- The goal line carries its own turn cap, and nothing in the scaffold merges.

Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the reuse ladder, root-cause fixing and the carve-outs in `hooks/context.md`.
- [grill-with-docs](https://github.com/mattpocock/skills) (Matt Pocock) - the interview in `/plan`: a decision tree, facts looked up rather than asked, terms sharpened, boundaries probed.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/build` grew from.
- [Diátaxis](https://diataxis.fr) (Daniele Procida, [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)) - the classification the `documentation` skill runs before writing; the framework's own text lives under `templates/skills/documentation/references/` on the same license.
