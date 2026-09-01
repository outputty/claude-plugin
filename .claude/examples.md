# Examples

The canonical worked examples, one base program and one data set, reused verbatim in chat sessions, tickets, PRs and docs. Every fenced block runs; a docs layer that changes an output re-runs the block and pastes the real result.

## A ticket's done-conditions

The shape `/plan` files and `/build` runs before it ends. Real values from this repo.

```markdown
## Done when

1. `/outputty:init` in a repo with an existing `.claude/rules/code.md` reports `.claude/rules/code.md: kept, differs from templates/rules/code.md` and leaves the file unchanged
2. `gh issue view <n> --json labels --jq '.labels[].name'` prints `ready`
3. No file outside `skills/init` and `templates/` changed
```

## The goal line /tickets prints for it

```text
/goal ticket #42 is built by following /build 42: /outputty:init on a repo with an existing .claude/rules/code.md reports it kept and leaves it unchanged; gh issue view 42 --json labels prints ready; no file outside skills/init and templates/ changed; every layer is an open draft PR in one stack with the docs layer last; or stop after 60 turns
```

## A layer plan, as /build comments it

```markdown
## Layers

1. L1 - `skills/init/SKILL.md` created-when-absent rule - Done when 1
2. L2 - `templates/skills/tracker/SKILL.md` label step - Done when 2, 3
3. docs - README install section, architecture.md `init` line marked done, CLAUDE.md Language swept
```
