# Architecture

The philosophy of this scaffold: the stack it runs on, how its components connect, the principles every change follows, and the end-to-end pipeline every ticket and PR is written against. High level by design; a low-level detail belongs in a skill or a rule. `/plan` and `/build` read it whole. `/plan` changes it when a decision settles, marked `pending #<n>`; the docs layer that delivers it marks the entry `done`.

## The stack

- **Claude Code** runs the sessions; the plugin is one command, `/outputty:init`, that copies the scaffold into the repo.
- **Two levels of copy**: what is about how the person works lives once under `~/.claude/` and reaches every repo: the flow skills, the tracker, the rule files, the output style, the expert skills. What is about this repo lives under `.claude/`: the docs, rules true here only, the templates, the settings. `init` and `retro` ask which side a file or a rule belongs to.
- **The tracker is the person's** - `~/.claude/skills/tracker/` under a fixed contract of headings, chosen once per machine. The shipped implementation is GitHub Issues with `gh` and `gh stack`: one ticket per roadmap item, `--blocked-by` for order, labels for state, a Project board for the columns.
- **Claude Code built-ins do the rest**: `/goal` judges a build, `/code-review` reviews a layer, worktrees isolate it, the Fable advisor answers judgement calls, auto-memory and `.claude/rules/` remember.

## How the components connect

```text
you
	/plan <idea>                     planning session: rounds, spikes, Root pick → one ticket, docs updated
		.claude/{product,roadmap,architecture,examples}.md   read whole; written when a decision settles
		~/.claude/projects/<project>/plans/<slug>.md         scratch, outside the repo, deleted after filing
		tracker skill                    create the ticket, add it to the board
	/tickets                         build session: what is open, blockers, the /goal line (tracker skill)
	/goal <ticket is built …>        typed by you; Haiku judges after every turn
		/build <n>                   claim → layer plan comment → one stacked PR per layer → docs layer → Done when cases run
			tracker skill            claim, board moves, the stack commands
			/code-review medium      once per layer, a fresh subagent
			advisor                  Fable, before the plan and before "done"
			retro                    a correction → one line in .claude/rules/
	merge the stack                  you; the ticket closes on the last PR
```

Two boundaries. **Planning → build** is a ticket: label `ready`, blockers closed. **Build → you** is a stack of draft PRs. Nothing else crosses; a build that needs a decision labels the ticket `needs-planning` and stops, and `/plan <n>` picks it up.

## Interfaces and overrides

- A skill is a procedure you type or the model loads; its body is the whole contract. A rule file is a fact that loads by itself. A template is what `init` copies once and the repo then owns.
- The managed block in `CLAUDE.md` is the scaffold's; everything outside the markers is the repo's, and `init` never touches it.
- `plan`, `tickets` and `build` never name a tracker; every tracker command lives in the `tracker` skill, under a fixed contract of headings, and a repo on another tracker rewrites that one file.
- A repo overrides a template by editing its copy; `init` keeps an existing file and says so. The output style is overridden by naming another in `settings.json`.
- A skill knows the docs and the `tracker` skill; it knows nothing about how another skill works inside.

## Principles

1. **Solve it one level up.** The place a symptom shows is the first place to look, never the last. Before fixing where it hurts, ask what the level above would need to change so the failure cannot be written; spike both and compare. (`/plan`, Root)
2. **A spike decides, not an argument.** Two shapes that argument cannot separate are both built thin, judged on one observable named beforehand, and the loser is deleted.
3. **The user picks between priced options.** Every option carries what it moves and what it breaks; a breaking change is priced like any other.
4. **A change is valid when its Done when cases run green and the pipeline below still runs.** Every PR pastes the real output.
5. **Build on what exists.** A near-duplicate is a defect; extend or unify instead. The platform's own mechanism beats one of ours.
6. **Prose that instructs is loaded or it does not exist.** A rule lives in the file that loads at the moment it applies; a procedure lives in the skill that runs it.
7. **One writer per doc.** `product.md` and `roadmap.md` by `/plan`; `architecture.md` pending by `/plan`, done by the docs layer; `examples.md` re-run by the docs layer; `.claude/rules/` by `retro`.

## The pipeline, end to end

What every ticket and PR is written towards: an idea to a merged stack.

```text
/plan "export orders as CSV"      →  ticket #42: Interface, Done when 1-3, blocked by #40
/tickets                          →  1. #42 CSV export   buildable · priority:high
/goal ticket #42 is built: … by following /build 42; or stop after 60 turns
                                  →  L1 PR #101, L2 PR #102, docs PR #103, each draft, stacked
merge PR 103 (tracker skill)      →  #42 closed, board Done
```

Input, a ticket's Done when:

```markdown
1. `bun run cli export --format csv fixtures/orders.json` prints a header line and 2 rows
2. `bun test test/export` prints `3 passed`
3. No file outside `src/export` changed
```

Output, the docs PR's **What this looks like** (expected until the first real run):

```text
$ bun run cli export --format csv fixtures/orders.json
id,customer,total
1,acme,120.00
2,globex,80.50
$ bun test test/export
3 passed
```

## Constraints in dependencies

- **`/goal` is typed by the user into the session that does the work** - no skill, agent or hook sets one; its judge skips a turn while a background agent runs. Probe: goal.md, "Background work defers evaluation".
- **`advisorModel` activates only when the advisor outranks the base model** (Fable 5 > Sonnet 5 > Haiku). Probe: `/advisor` shows "Advisor Tool (experimental) is on".
- **`permissions.defaultMode: auto` applies only from user or managed settings**, never a project file. Probe: permission-modes.md.
- **GitHub tracker: `gh stack init <new name>` branches from the default branch and drops local commits**; adopt the current branch by name. Probe: `gh stack init --help`.
- **`.claude/rules/*.md` without `paths:` loads at launch; with `paths:` on first matching read.** Probe: memory.md, "Path-scoped rules".
