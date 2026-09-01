# Product

The product's truth, written as finished documentation. Each section quotes the terms it uses from `CLAUDE.md`'s Language; implementation lives in `architecture.md`; examples come from `examples.md`.

## North Star

One scaffold, copied into every repo I work on and owned there, that carries an idea to a merged PR through the repo's tracker with the human at three points only: settling what to build, choosing which ticket to build next, and reviewing what was built. It builds on Claude Code's own mechanisms (`/goal`, `/code-review`, worktrees, the advisor, auto-memory) and adds nothing the platform already does. It must never grow a tracker, a scheduler, a dispatcher or a reviewer of its own again, and it prescribes no tracker: the `tracker` skill is the repo's.

## Functionality

### Scaffolding a repo

`/outputty:init` copies the scaffold in once: the flow skills, output style, rules and expert template to `~/.claude/`, once per machine; the five docs, templates and settings to the repo. It fills each doc with the user section by section, turns the repo's domain knowledge into expert skills the user picks, and opens a PR. A re-run reports drift per file and changes nothing uninvited. The tracker is the person's own: GitHub Issues ships as the implementation, and any other tracker is a rewrite of that one skill file under the same headings.

### Planning an idea into a ticket

`/plan <idea>` interviews in rounds until no answerable question remains, verdicts every premise, spikes every level the fix could land at, and prices them for the user's pick. On "settled" it files one ticket carrying the agreed interface and seam, writes the settled capability into the docs, and runs a retro. A build that hits a design question sends its ticket back, and `/plan <n>` resumes it.

> **Planning session** - an attended session that runs `/plan` and ends with one ticket on the board, or resumes a ticket labelled `needs-planning`.
>
> **Ticket** - one roadmap item: the interface agreed in planning, the end state as Done when cases, and what it is blocked by.
>
> **Scratch file** - a planning session's running record outside the repo; a restarted session resumes from it.
>
> **needs-planning** - the label a build leaves when a ticket needs its plan reopened.

```markdown
## Done when

1. `/outputty:init` in a repo with an existing `.claude/rules/code.md` reports `.claude/rules/code.md: kept, differs from templates/rules/code.md` and leaves the file unchanged
2. `gh issue view <n> --json labels --jq '.labels[].name'` prints `ready`
3. No file outside `skills/init` and `templates/` changed
```

### Picking the next ticket

`/tickets` lists what is open with blockers and priority, prints the `/goal` line for the first buildable ticket, and opens the pick in its own session: inside Herdr a new tab with `claude --worktree` on the right model and the line already sent, otherwise the command to run by hand.

> **Build session** - a session on its own worktree, started by hand, that builds one ticket under a `/goal` the user types.
>
> **Done when** - the numbered, runnable end-state cases in a ticket; the build runs every one, and the `/goal` judge reads them.

```text
/goal ticket #42 is built by following /build 42: /outputty:init on a repo with an existing .claude/rules/code.md reports it kept and leaves it unchanged; gh issue view 42 --json labels prints ready; no file outside skills/init and templates/ changed; every layer is an open draft PR in one stack with the docs layer last; or stop after 60 turns
```

### Building a ticket to a stack

Under the typed `/goal`, `/build <n>` claims the ticket, comments its layer plan, and builds one reviewed draft PR per layer: the test layer first, each later layer flipping the cases it serves live, the enable layer deleting the flag and the old path, the docs layer last, closing the ticket. Every Done when case runs and its real output is pasted. The user merges the stack.

> **Layer** - one PR in a ticket's stack, chosen by the build session so the program works after each merge; the last layer is docs.
>
> **Test layer** - the first layer of a stack: every Done when case landed as an expected-fail e2e test, flipped live by the layer that serves it.

```markdown
## Layers

1. L1 - `skills/init/SKILL.md` created-when-absent rule - Done when 1
2. L2 - `templates/skills/tracker/SKILL.md` label step - Done when 2, 3
3. docs - README install section, architecture.md `init` line marked done, CLAUDE.md Language swept
```

### Remembering

Every planning session and every build's docs layer runs a retro: a correction becomes a rule in the file that loads at the moment it applies, and a lesson recording the mistake and the change it produced. Domain knowledge that outlives the repo becomes one expert skill per tool, vendor or discipline under `~/.claude/skills/<domain>/`, a prior that planning re-verifies and improves.

> **Rule** - one prescriptive line in a `rules/` file that loads at the moment it applies; it enforces.
>
> **Lesson** - one entry in `.claude/lessons.md`: the mistake and the change it produced; it remembers.

### The docs a repo keeps

Five files under `.claude/` hold the repo's truth, each rewritten the moment its content settles or ships: the product (this file), the implementation (`architecture.md`), the chunks of work (`roadmap.md`), the canonical examples (`examples.md`), and the mistakes (`lessons.md`). The canonical Language lives in `CLAUDE.md` at the repo root.
