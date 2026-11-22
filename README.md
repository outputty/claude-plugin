# outputty

This is my personal setup for developing projects with Claude Code, meant to be used together with [Herdr](https://herdr.dev), the terminal workspace manager for coding agents. The plugin ships its skills, its standing lines and its output style; one command copies its rules under `~/.claude/` and its templates into a repo, and each copy is owned and edited where it lands.

Herdr is what makes the sessions cheap to run side by side: every plan, prototype and build opens as a new tab in the current workspace, next to the session that picked it, with `claude --worktree` started on the right model and the prompt already sent. Without Herdr the same flow works by hand, one `claude --worktree` per session.

The idea: I decide what to build, I pick what gets built next, and I review what was built. Everything in between runs on rules.

The plugin brings almost no code patterns of its own. The agent takes ownership of the code and multiplies the patterns the repo already has, one pattern per job, instead of mixing new ones in. I own the architecture and the system design; the agent repeats what works, and tests end to end or through integration tests, a unit test being the rare exception. Everything else is decided in the repo, in its own `CLAUDE.md`. The exceptions live in skills, such as `typescript-node`, which prescribes how to write types so that an agent adds features without regressions.

## The sessions

**Planning** is a session I sit in.

- `/outputty:plan` interviews me about an idea until nothing answerable is left.
- It reads the fix where it shows and one level up, lists what each one changes and breaks, and takes my pick.
- On my yes it files one ticket: the interface we agreed, Implementation criteria, and what must land first.
- Everything the session learns goes to a scratch file outside the repo, so a restarted session resumes instead of asking again.
- Several planning sessions can run side by side; each ends with one ticket and its planning PR. The ticket carries no task breakdown; that is the builder's.
- A build that hits a design question sends the ticket back with `needs-planning`, and `/outputty:plan <n>` reopens it.

**Prototyping** is a session on its own worktree, on Haiku, when I want to see it working before I settle it.

- `/outputty:prototype <idea>` or `/outputty:prototype <n>` opens in its own tab, writes a test for every requirement first, then wires the fastest path through patterns the repo already has.
- Anything that needs a new concept is stubbed with `TODO: stub`, so I see the whole flow working.
- The work stays on a local `prototype/<name>` branch: `/outputty:plan` reads it for an idea, and `/outputty:build` continues it, keeps its tests and replaces every stub.

**Building** is a session on its own worktree, on Sonnet.

- `/outputty:tickets` in my primary session lists what is open with blockers and priority, and prints the `/goal` line for the one to build.
- On my pick it opens the session: inside Herdr, a new tab alongside with `claude --worktree ticket-<n> --model sonnet` started and the goal line sent; outside Herdr, the `claude --worktree` command for me to run.
- A `needs-planning` pick opens a planning tab the same way, on Opus 5.5 (`--model claude-opus-5-5`), with `/outputty:plan <n>` sent. The primary session plans or builds inline only when I say "do it here".
- Under that goal the session posts its layer plan as a comment on the ticket, builds one layer at a time onto the ticket's one PR, ready for review, and runs one `/code-review` over the whole build at the end. A ticket I labelled `stack` while planning gets one stacked PR per layer instead.
- The docs are the last layer, written when the final output is known.
- It runs every Implementation-criteria case and pastes the real output; the `/goal` judge reads those outputs after each turn.
- It publishes a build-story `Artifact` tracking the whole build, one section per layer, republished as each layer lands - I can watch it without waiting for the PR.
- When a ruling is missing, the session asks me. I am there.

**Me, in between:** I read the PR and give the go-ahead to merge, which stands for later builds in the session until I withdraw it. The ticket closes on the merge.

```text
primary session (Herdr workspace root, on main)
  /outputty:tickets → pick → herdr tab create + herdr agent start (claude --worktree, the prompt sent with it)

planning tab (Opus 5.5)                        build tab (Sonnet, Fable advising)
  /outputty:plan <idea or n>                   /goal … by following /outputty:build <n>
    record written, ticket filed, PR opened    layer plan, one PR, docs last

prototype tab (Haiku), optional
  /outputty:prototype <idea or n>
    tests first, existing patterns, stubs → local prototype/<name>, read by /outputty:plan or continued by /outputty:build
me: review, merge
```

Model policy: planning on Opus 5.5, pinned by id, because its judgement calls are the expensive part; prototypes on Haiku, because they only reuse and stub; builds on Sonnet, because the layers are mechanical once planned; the advisor is whatever `advisorModel` your own `~/.claude/settings.json` sets; the repo settings never pin one.

## What the plugin ships, what it copies, and where

The plugin itself is its skills, a SessionStart hook and an output style. Each skill runs as `/outputty:<name>`; the hook prints `hooks/context.md`, the standing lines, into every session; and the style is forced while the plugin is enabled. An upgrade reaches every session, and none of them is copied. `/outputty:init` copies the rest at two levels: what is the same in every repo goes once under `~/.claude/` and reaches every session on the machine; what is the repo's goes under the repo's `.claude/`. Both are the owner's to edit.

User level, `~/.claude/`, about how I work: the code rules and a rule file per language, and the README template. Repo level, the outputs about this repo: rules true here only, the templates, the settings, and the repo's `CLAUDE.md`.

- **`/outputty:plan`** - the interview: every answerable question in one numbered round with a recommendation, every premise grounded, absent or named as unknown, every level the fix could land at shown with what it changes and breaks. It edits nothing and files nothing until I say go; at go it writes one record of the discussion, files the ticket with the grade of finish I asked for and the `stack` label only when I asked for a stack, and never widens the scope: a widening is offered as its own ticket. A spike that is already the complete fix offers a fast-path fix: on "build it now" the ticket goes straight to its build tab, or it is filed for a separate build.
- **`/outputty:prototype`** - an idea or a ticket seen working cheaply, on Haiku: tests first, existing patterns only, new concepts stubbed, kept on a local branch for `/outputty:plan` or `/outputty:build`.
- **`/outputty:tickets`** - the open tickets with blockers and priority, the `/goal` line for one, and the handoff.
- **`/outputty:herdr`** - how a session is opened inside Herdr: a new tab in the current workspace, `claude --worktree` started in it on the right model, the prompt sent; the plan, prototype and build cases; the workspace and pane traps.
- **`/outputty:build`** - one ticket to one PR, or to a stack when I labelled it `stack`, under the goal.
- **`/outputty:audit`** - a read-only pass over a codebase, or the folders I name, against every code rule: each discrepancy with its file and line, each unclear case as a question to me, and a refactor plan I decide how to action.
- **`/outputty:tracker`** - the exact commands for listing, reading and creating tickets, dependencies, board moves, a ticket's PR and stacked PRs, for GitHub Issues with `gh`. `plan`, `prototype`, `tickets` and `build` name no tracker.
- **`/outputty:retro`** - on my request, after a build or any time: I pick the sessions to read, and each correction I repeat becomes a new lint rule with a probe test, the removal of a lint rule that conflicts with it, or a line in the repo's `CLAUDE.md`.
- **`/outputty:{data-engineering,frontend,typescript-node}`** - precise, verified traps per domain, as Do and Don't lines per tool or topic: loads, staging, MERGE races and cross-engine hashing; hydration, TanStack Table v9 and shadcn recipes; exhaustive matching, dual ESM/CJS builds, Bun vs Node and node:cluster. Each loads only when a task touches its domain.
- **`/outputty:documentation`** - classifies content by Diátaxis (tutorial, how-to, reference, explanation) before writing it, then writes or rewrites a README or project doc against `~/.claude/readme-template.md`'s spine, de-slopping one that reads AI-generated. The build skill's docs layer invokes it.
- **`output-styles/outputty.md`**, in the plugin - how replies look: an end-to-end example, a flowchart, a gantt chart or a tree, few words; and how a session works: the least work that meets the requirement, built on what already exists, how it keeps a long session from drifting, how it briefs an agent and how it writes an instruction line. Forced while the plugin is enabled. A repo that sets `"outputty@outputty": false` in its `.claude/settings.json` turns the plugin off there, style and standing lines together.
- **`hooks/context.md`**, in the plugin - the standing lines, printed into every session by a SessionStart hook: the plan/prototype/build tab gate, and the session, change, claim and writing rules. A line in your own `CLAUDE.md` wins where it disagrees. **`~/.claude/rules/code.md`** - the code rules for any language, loaded in every session: the LSP first, structure, one shape for every class, functions that fit in your head, names, docstrings and tests. **`~/.claude/rules/typescript.md`** - TypeScript rules, loaded only for `.ts` files: a schema at the public entry and assertion functions inside, one test watcher for the session, TSDoc, and type traps; **`.claude/rules/`** - rules true in this repo only.
- **`CLAUDE.md`** - the repo's minimal alignment document, drafted with me at init: what the project is, where each kind of file lives, the Language terms and the tracker ids.
- **`~/.claude/readme-template.md`** - the shape of a README: spine, fence tags, API-bullet format.
- **`~/.claude/skill-template.md`** - the shape of a skill: Do and Don't by topic or Steps, a Glossary, snippet files.
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

Each doc holds current state only; the commit history and closed issues hold history. A correction I repeat becomes a lint rule or a `CLAUDE.md` line through `retro`.

Machine-level facts go to auto-memory. Nothing else remembers anything.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`.

- It copies the rule files and the README template under `~/.claude/`, once per machine, and the templates and the settings into the repo. A file already present at either level is kept, and its drift from the scaffold is reported.
- On a machine an older init set up, it removes what the plugin now supplies: the standing lines merged into `~/.claude/CLAUDE.md`, the copied `~/.claude/output-styles/outputty.md`, the `outputStyle` key, and the skills it copied under `~/.claude/skills/`. It shows me the diff and writes only on my yes.
- It reads the repo with one agent per source: docs wherever they live, code, git history, existing instruction files.
- It drafts the repo's `CLAUDE.md` with me: what the project is, where each kind of file lives, the Language terms. It removes the flow and standing lines an older init merged into the file, shows me the diff, and writes only on my yes.
- It ends by adding the repo's check commands to the allowlist, creating the tracker's labels, writing the board ids into the **This repo** section of `CLAUDE.md`, and opening the PR.

Re-running `/outputty:init` after a scaffold upgrade prints, per file, `unchanged` or `kept, differs from <template>`; taking the diff is the repo's call, file by file.

Requirements: Herdr on `PATH` (`herdr` with `HERDR_ENV=1` inside its session; the flow degrades to hand-run `claude --worktree` without it), Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent). For the shipped GitHub tracker: `gh` 2.96 or later and a GitHub Project with a Status field; for a ticket labelled `stack`, also `gh extension install github/gh-stack` with stacked PRs enabled on the repo.

## Safety

The scaffold copies no hooks; the plugin runs one, at session start, which only prints its standing lines. One `permissions.deny` entry blocks `ScheduleWakeup`.

- The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`.
- They ask before `rm -rf` and `git clean -f`.
- The goal line carries its own turn cap, and nothing merges without my go-ahead.

Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the reuse order and the carve-outs in `templates/rules/code.md`, and root-cause fixing in `hooks/context.md`.
- [grill-with-docs](https://github.com/mattpocock/skills) (Matt Pocock) - the interview in `/outputty:plan`: a decision tree, facts looked up rather than asked, terms sharpened, boundaries probed.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/outputty:build` grew from.
- [Diátaxis](https://diataxis.fr) (Daniele Procida, [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)) - the classification the `documentation` skill runs before writing; the framework's own text lives under `skills/documentation/references/` on the same license.
