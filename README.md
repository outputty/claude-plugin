# outputty

A Claude Code plugin for developing projects with [Herdr](https://herdr.dev), the terminal workspace manager for coding agents.

- I decide what to build, and I review what was built.
- Everything in between runs on rules, one session per tab.
- Without Herdr the same flow works by hand: one `claude --worktree` per session.

## The flow

```text
research session (async, the user drives) --> research document
                                                  |
primary session: /plan (ideas, needs-planning tickets) --> ticket labelled ready
                                                  |
build session: /goal over every buildable ticket   or   /build <n> [<m> ...]
  per ticket: align on facts --> build --> simplify --> /code-review --> PR
  merge classifier clears the PR, or the user skipped manual review --> agent merges
  otherwise --> PR waits for the user to merge
  next ticket depends on an unmerged PR --> branch from that PR's branch (no GitHub stack link)
dream (async, on request) --> edits to skills, rules, CLAUDE.md
```

## Install

```bash
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then inside the repo, once: `/outputty:init`.

- It copies the rule files and the README template under `~/.claude/`, and the templates and settings into the repo.
- It reads the repo with one agent per source, then drafts the repo's `CLAUDE.md` with me and writes it only on my yes.
- It ends by adding the repo's check commands to the allowlist, creating the tracker's labels and writing the board ids into `CLAUDE.md`.
- Re-running it prints, per file, `unchanged` or `kept, differs from <template>`.

Requirements: Claude Code 2.1.247 or later, Herdr on `PATH`, `gh` 2.96 or later with a GitHub Project that has a Status field, and Fable access for the advisor. A ticket labelled `stack` also needs `gh extension install github/gh-stack`.

## The sessions

Each session opens as a Herdr tab with `claude --worktree`, on its own model, with its prompt already sent.

### Research

`/research <topic>` runs on Opus 5.5, started with `--effort ultracode`.

- It grills me until every base is covered.
- It fans out Haiku and Sonnet agents that gather and categorize.
- It validates each finding against its source and redoes the research that fails.
- It ends with `docs/research/<slug>.md` in a PR, which `/plan` can read. It files no ticket.

### Planning

`/plan <idea>` runs on Opus 5.5, and I sit in it.

- It interviews me until nothing answerable is left, and shows every level a fix could land at with what it changes and breaks.
- On my yes it files one ticket: the end state, Implementation criteria, and what must land first.
- Its running record lives in a scratch file outside the repo, so a restarted session resumes.
- A build that hits a design question labels the ticket `needs-planning`, and `/plan <n>` reopens it.

### Prototyping

`/prototype <idea or n>` runs on Haiku, when I want to see it working before I settle it.

- It writes a test per requirement first, then wires the fastest path through patterns the repo already has.
- Anything new is stubbed with `TODO: stub`.
- The work lands on a `prototype/<name>` branch on GitHub, which `/plan` reads and a ticket's **Base** can name.

### Building

`/build` runs on Sonnet, one worktree per build.

- `/tickets` lists what is open, with blockers and priority, and prints the goal line for one ticket and a loop goal line over every buildable ticket. A named set of tickets gets its own line.
- Per ticket the build posts its layer plan, builds layer by layer onto one PR, simplifies the diff, runs one `/code-review`, and writes the docs last.
- It runs every Implementation-criteria case and pastes the real output. The `/goal` judge reads those outputs.
- A ticket labelled `stack` gets one PR per layer instead.
- A ticket blocked by an open, unmerged PR branches from that PR's branch. Its own PR targets `main`.
- On a Fable session the build makes no `advisor` call. Where a clean context helps, it starts an agent briefed for the task.

### The merge rule

After `/code-review`, a Haiku classifier reads the whole PR diff and reports three things: a public API change, possibly breaking functionality, and a major refactor.

```text
PR #310  public API: none  breaking: none  major refactor: none   -> the agent merges
PR #311  public API: /plan's ticket shape changed                 -> waits for me
I said "skip manual review" in this session                       -> the agent merges every PR
```

A merge that deploys always waits for me.

## What ships, what it copies

The plugin ships its skills, a SessionStart hook and a forced output style. An upgrade reaches every session.

- **Plugin skills**, typed `/outputty:<name>`: `init`, `herdr` (opens each tab), `dream` (turns friction in past transcripts into measured, committed edits), `eval` (measures a change to the style, hook, rules or a skill).
- **User skills**, copied by `init` to `~/.claude/skills/outputty-<name>/` and typed `/<name>`: `plan`, `prototype`, `research`, `tickets`, `build`, `audit`, `tracker`, `documentation`, `typescript-node`, `ts-pattern`, `tsup`. The copy is mine, and an upgrade never overwrites it.
- **Rules**: `~/.claude/rules/outputty-code.md` for any language, and `outputty-typescript.md` for `.ts` files.
- **Repo level**: `CLAUDE.md` drafted at init, `.github/` ticket and PR templates, and `.claude/settings.json`.

After an upgrade, `init` prints what a template changed as offers and writes nothing into my copy.

`/outputty:dream` starts from `friction.ts`, which prints one JSON line per flagged window:

```bash
bun skills/dream/scripts/friction.ts __tests__/fixtures/friction/reread.jsonl
```

```text
{"session":"reread","start":"2026-11-20T10:00:00Z","end":"2026-11-20T10:05:30Z","toolCalls":11,"repeatReads":[{"path":"/repo/tracker/SKILL.md","count":4}],"durationMs":330000,"corrections":0,"skillsLoaded":["build","tracker"]}
```

## Where a repo keeps things

The plugin names no layout. Each repo's `CLAUDE.md` says where each kind of knowledge lives. Mine:

1. **Tests** - the behaviour.
2. **The linter** - the rules a tool can hold.
3. **`.claude/rules/`** - the judgement a tool cannot hold.
4. **`README.md`** - the front door.
5. **Issues in the tracker** - the plan.

Each doc holds current state only. A friction I repeat becomes an edit through `dream`.

## Safety

The scaffold copies no hooks. The plugin runs one, at session start, which only prints its standing lines.

- Every session Herdr opens starts with `--permission-mode bypassPermissions`, so no permission prompt bounds it. `deny` rules still block in that mode, per the [permission modes doc](https://code.claude.com/docs/en/permission-modes); an allow rule has no effect.
- A goal line carries no turn cap. `/goal clear` ends a goal at any time.
- A missing ruling is a question, asked with `AskUserQuestion`, never a guess.
- Nothing merges unless I said to skip manual review, or the merge classifier reports none of its three findings and the merge does not deploy.
- One build per worktree. The primary checkout is edited only when I ask for a direct edit there.

`templates/settings.json` is deep-merged into a repo's `.claude/settings.json`. Arrays under `allow`, `deny` and `ask` union with what the repo has, and a `deny` matches at any depth.

```json
{
  "worktree": { "baseRef": "head" },
  "permissions": {
    "allow": ["Bash(git:*)", "Bash(gh:*)"],
    "deny": [
      "Read(.env)",
      "Edit(.env)",
      "Read(.env.local)",
      "Edit(.env.local)",
      "Read(secrets/**)",
      "Edit(secrets/**)",
      "Read(*.pem)",
      "Edit(*.pem)",
      "Read(*.key)",
      "Edit(*.key)",
      "Read(credentials.json)",
      "Edit(credentials.json)",
      "ScheduleWakeup"
    ],
    "ask": ["Bash(rm -rf:*)", "Bash(git clean -f:*)"]
  }
}
```

Not covered:

- **Content-level credential scanning** - a `deny` matches a path only. Use `gitleaks` in CI.
- **`NotebookEdit`** - the secret-path rules do not match it.
- **The audit skill** - read-only by instruction, not by a permission.
- **Advisor spend** - Fable as advisor bills per call, with the whole transcript as input. Watch it with `/usage`.

## What it relies on

- `/goal` is set in the session that does the work, typed or sent as its starting prompt. Its judge skips a turn while a background agent runs.
- `advisorModel` activates only when the advisor outranks the base model.
- `permissions.defaultMode: auto` applies only from user or managed settings, never a project file.
- A plugin has no always-loaded rule, so the standing lines ride a SessionStart hook and `init` copies the code rules to `~/.claude/rules/`.
- `force-for-plugin: true` overrides the user's `outputStyle`. A repo turns the plugin off with `"outputty@outputty": false` in its `.claude/settings.json`.

## Credits

- [ponytail](https://github.com/DietrichGebert/ponytail) (Dietrich Gebert) - the reuse order and the carve-outs in `templates/rules/code.md`, and root-cause fixing in `hooks/context.md`.
- [grill-with-docs](https://github.com/mattpocock/skills) (Matt Pocock) - the interview in `/plan`: a decision tree, facts looked up rather than asked, terms sharpened, boundaries probed.
- The `/batch` worker checklist and the `fix-issue` skill in Claude Code's best-practices doc, which `/build` grew from.
- [Diátaxis](https://diataxis.fr) (Daniele Procida, [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)) - the classification the `documentation` skill runs before writing; the framework's own text lives under `skills/documentation/references/` on the same license.
