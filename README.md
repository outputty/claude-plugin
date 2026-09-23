# outputty

This is my personal setup for developing projects with Claude Code, meant to be used together with [Herdr](https://herdr.dev), the terminal workspace manager for coding agents. It is a scaffold: one command copies it into a repo, and the repo owns and edits its copy from then on.

Herdr is what makes the sessions cheap to run side by side: every plan and every build opens as a new tab in the current workspace, next to the session that picked it, with `claude --worktree` started on the right model and the prompt already sent. Without Herdr the same flow works by hand, one `claude --worktree` per session.

The idea: I decide what to build, I pick what gets built next, and I review what was built. Everything in between runs on rules.

## Two kinds of session

**Planning** is a session I sit in.

- `/plan` interviews me about an idea until nothing answerable is left.
- It spikes the fix where it shows and one level up, prices both, and takes my pick.
- On my yes it files one ticket: the interface we agreed, Implementation criteria, and what must land first.
- Everything the session learns goes to a scratch file outside the repo, so a restarted session resumes instead of asking again.
- Several planning sessions can run side by side; each ends with one ticket and nothing else. The ticket carries no task breakdown; that is the builder's.
- A build that hits a design question sends the ticket back with `needs-planning`, and `/plan <n>` reopens it.

**Building** is a session on its own worktree, on Sonnet.

- `/tickets` in my primary session lists what is open with blockers and priority, and prints the `/goal` line for the one to build.
- On my pick it opens the session: inside Herdr, a new tab alongside with `claude --worktree ticket-<n> --model sonnet` started and the goal line sent; outside Herdr, the `claude --worktree` command for me to run.
- A `needs-planning` pick opens a planning tab the same way, on the default model, with `/plan <n>` sent. The primary session plans or builds inline only when I say "do it here".
- Under that goal the session posts its layer plan as a comment on the ticket, builds one layer at a time, opens one stacked PR per layer, ready for review, and runs one `/code-review` over the whole stack at the end.
- The docs are the last layer, written when the final output is known.
- It runs every Implementation-criteria case and pastes the real output; the `/goal` judge reads those outputs after each turn.
- It publishes a build-story `Artifact` tracking the whole stack, one section per layer, republished as each layer lands - I can watch it without waiting for the PR stack.
- When a ruling is missing, the session asks me. I am there.

**Me, in between:** I read the stack and type "merge". The ticket closes on the last PR.

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

User level, `~/.claude/`, about how I work: the flow skills, the tracker, the outputty block in `~/.claude/CLAUDE.md`, the output style, the domain skills, and the skill and README templates. Repo level, the outputs about this repo: the four docs, rules true here only, the templates, the settings, the block with the board ids.

`init` asks two things that decide the split: which tracker I use (once per machine), and, for every repo-level file an earlier scaffold left behind, whether it moves to `~/.claude/` or stays.

- **`~/.claude/skills/plan`** - the interview: every answerable question in one numbered round with a recommendation, every premise grounded, absent or spiked, every level the fix could land at priced. On my yes it files the ticket and adds its roadmap line. A spike that is already the complete fix offers a fast-path fix: build it now, or file it for a separate build.
- **`~/.claude/skills/tickets`** - the open tickets with blockers and priority, the `/goal` line for one, and the handoff.
- **`~/.claude/skills/herdr`** - how a session is opened inside Herdr: a new tab in the current workspace, `claude --worktree` started in it on the right model, the prompt sent; the plan case and the build case; the workspace and pane traps.
- **`~/.claude/skills/build`** - one ticket to one stack, under the goal.
- **`~/.claude/skills/tracker`** - the exact commands for listing, reading and creating tickets, dependencies, board moves and stacked PRs, under a fixed set of headings. The shipped copy is GitHub Issues with `gh`; on Linear or another tracker the commands are rewritten under the same headings, once per machine, and nothing else changes. `plan`, `tickets` and `build` name no tracker.
- **`~/.claude/skills/retro`** - on my request, after a build or any time: I pick the sessions to read, and each correction becomes a revision of the one file that owns the behaviour.
- **`~/.claude/skills/{data-engineering,frontend,typescript-node}`** - precise, verified traps per domain, grouped by problem: loads, staging, MERGE races and cross-engine hashing; hydration, TanStack Table v9 and shadcn recipes; exhaustive matching, dual ESM/CJS builds, Bun vs Node and node:cluster. Each loads only when a task touches its domain.
- **`~/.claude/skills/documentation`** - classifies content by Diátaxis (tutorial, how-to, reference, explanation) before writing it, then writes or rewrites a README or project doc against `~/.claude/readme-template.md`'s spine, de-slopping one that reads AI-generated. The build skill's docs layer invokes it.
- **`~/.claude/output-styles/outputty.md`** - how replies look: an end-to-end example, a call-stack graph or tree, few words. Turned on once by `outputStyle` in `~/.claude/settings.json`.
- **`~/.claude/CLAUDE.md`** - the outputty block: tool preferences, the plan/build tab gate, code, docstring and comment rules; **`~/.claude/rules/typescript.md`** - TypeScript rules, loaded only for `.ts` files; **`.claude/rules/`** - rules true in this repo only.
- **`.claude/{product,roadmap,architecture,examples}.md`** - the four product docs, filled with me at init.
- **`~/.claude/skill-template.md`** - the shape of a new domain skill, written only on request.
- **`~/.claude/readme-template.md`** - the shape of a README: spine, fence tags, API-bullet format.
- **`.github/`** - the ticket and PR templates.
- **`.claude/settings.json`** - `advisorModel: fable`, secret-path denies, and a deny on `ScheduleWakeup`.

## The docs a repo keeps

Four files under `.claude/`, current state only; git and closed issues hold history:

1. **`product.md`** - the product's truth as finished documentation: every capability, built and aimed-for alike, no development context. The docs layer rewrites what a build changed.
2. **`architecture.md`** - the implementation: stack, connections, interfaces, patterns and principles, and the end-to-end pipeline every ticket and PR is written towards. `/plan` marks a change `pending #<n>`; the docs layer removes the marker.
3. **`roadmap.md`** - Next, Later and Killed, one line each. The only doc that names tickets.
4. **`examples.md`** - the canonical examples every done-condition, PR and chat session reuses.

A correction becomes a rule only when I ask for it with `retro`, which rewrites the owning file whole rather than appending a line.

A domain skill under `~/.claude/skills/<domain>/` is written only when I ask for one, from `~/.claude/skill-template.md`.

Machine-level facts go to auto-memory. Nothing else remembers anything.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`.

- It copies the flow skills, the tracker, the `~/.claude/CLAUDE.md` block, the output style and the skill template under `~/.claude/`, once per machine, and the docs, the templates and the settings into the repo. A file already present at either level is kept, and its drift from the scaffold is reported.
- It asks which tracker I use, once per machine, and rewrites the `tracker` skill with me when it is not GitHub.
- It finds repo-level copies an earlier scaffold left (skills, rules, the output style) and asks, per file, whether each moves to `~/.claude/` or stays.
- It reads the repo with one agent per source: docs wherever they live, code, git history, existing instruction files.
- It fills the product docs one at a time: a draft with every claim cited, a numbered round of questions with recommendations, my answers, the file written. An existing doc in another shape is mapped into the new sections; what does not fit is asked about, not dropped.
- Repo-only rules found in old files become one line each in `.claude/rules/`.
- It ends by adding the repo's check commands to the allowlist, creating the tracker's labels, writing the board ids into `CLAUDE.md`, and opening the PR.

Re-running `/outputty:init` after a scaffold upgrade prints, per file, `unchanged` or `kept, differs from <template>`; taking the diff is the repo's call, file by file.

Requirements: Herdr on `PATH` (`herdr` with `HERDR_ENV=1` inside its session; the flow degrades to hand-run `claude --worktree` without it), Claude Code 2.1.247 or later, and Fable access for the advisor (`/model fable` once to consent). For the shipped GitHub tracker: `gh` 2.96 or later, `gh extension install github/gh-stack` with stacked PRs enabled on the repo, and a GitHub Project with a Status field.

## Safety

No hooks. One `permissions.deny` entry blocks `ScheduleWakeup`.

- The settings deny reads and writes on `.env`, `.env.local`, `secrets/**`, `*.pem`, `*.key` and `credentials.json`.
- They ask before `rm -rf` and `git clean -f`.
- The goal line carries its own turn cap, and nothing in the scaffold merges.

Details in [`docs/security.md`](docs/security.md).

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the reuse ladder, root-cause fixing and the carve-outs in the `~/.claude/CLAUDE.md` block.
- [grill-with-docs](https://github.com/mattpocock/skills) (Matt Pocock) - the interview in `/plan`: a decision tree, facts looked up rather than asked, terms sharpened, boundaries probed.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/build` grew from.
- [Diátaxis](https://diataxis.fr) (Daniele Procida, [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)) - the classification the `documentation` skill runs before writing; the framework's own text lives under `templates/skills/documentation/references/` on the same license.
