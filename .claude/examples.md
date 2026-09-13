# Examples

The canonical worked examples, one base program and one data set, reused verbatim in tickets, PRs and docs. Every fenced block runs; a docs layer that changes an output re-runs the block and pastes the real result.

## A ticket's done-conditions

The shape `/plan` files and `/build` runs before it ends. Real values from this repo.

```markdown
## Implementation criteria

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

Flag: `OUTPUTTY_INIT_REPORTS_KEPT=1`

1. L1 - `test/init.spec.ts`: every Implementation-criteria case as an expected-fail e2e test - 0 live
2. L2 - `skills/init/SKILL.md` created-when-absent rule - Implementation criteria 1 live
3. L3 - `templates/skills/tracker/SKILL.md` label step - Implementation criteria 2, 3 live
4. enable - flag, old path and flag setup in tests deleted - every case live without the flag
5. docs - README install section, architecture.md `init` line marked done, product.md Language swept
```
