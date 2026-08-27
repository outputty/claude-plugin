# Examples

The canonical worked examples, one base program and one data set, reused verbatim in issues, PRs and docs. Every fenced block runs; a PR that changes an output re-runs the block and pastes the real result.

## A sub-issue's done-conditions

The shape `breakdown` files and the `/goal` judge reads. Real values from this repo.

```markdown
## Done when

1. `/outputty:init` in a repo with an existing `.claude/rules/code.md` reports `.claude/rules/code.md: kept, differs from templates/rules/code.md` and leaves the file unchanged
2. `gh issue view <n> --json labels --jq '.labels[].name'` prints `ready`
3. No file outside `skills/init` changed
```

## init, run a second time

```text
/outputty:init
```

Output (second run in this repo, real, from the script the skill replaced; the skill reports the same lines):

```text
CLAUDE.md: block replaced, text outside the markers untouched
.claude/rules/code.md: unchanged
.claude/rules/docs.md: unchanged
.claude/rules/issues.md: unchanged
.claude/product.md: kept, differs from templates/docs/product.md
.claude/roadmap.md: kept, differs from templates/docs/roadmap.md
.claude/architecture.md: kept, differs from templates/docs/architecture.md
.claude/examples.md: kept, differs from templates/docs/examples.md
.github/ISSUE_TEMPLATE/task.md: unchanged
.github/PULL_REQUEST_TEMPLATE.md: unchanged
.claude/settings.json: templates/settings.json merged, other keys preserved
```
