# Examples

The canonical worked examples, one base program and one data set, reused verbatim in tickets, PRs and docs. Every fenced block runs; a docs layer that changes an output re-runs the block and pastes the real result.

## A ticket's done-conditions

The shape `/grill` files and `build` runs before it ends. Real values from this repo.

```markdown
## Done when

1. `/outputty:init` in a repo with an existing `.claude/rules/code.md` reports `.claude/rules/code.md: kept, differs from templates/rules/code.md` and leaves the file unchanged
2. `gh issue view <n> --json labels --jq '.labels[].name'` prints `ready`
3. No file outside `skills/init` changed
```

## A layer plan, as the build agent comments it

```markdown
## Layers

1. L1 - `templates/loop.md` and the `github` next-ticket query - Done when 2
2. L2 - `agents/build.md` preloads `build`, `github`, `retro` - Done when 1, 3
3. docs - README loop section, architecture.md `loop.md` entry marked done, product.md Language swept
```

## One tick of the loop

```text
/loop 10m
```

Output (expected until the first real run):

```text
tick: 1 live, spawned #42
```
