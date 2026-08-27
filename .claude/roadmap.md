# Roadmap

Why each open parent issue is worth building, and now. Status lives on the GitHub board, not here. `/breakdown` adds a paragraph when it files a parent; a merged parent's paragraph moves under Shipped or is deleted.

## Next

- **First real run** - one parent issue through `/grill` → `breakdown` → `/goal` → `fix-issue` in this repo. It settles the four unverified points: `$ARGUMENTS` in a preloaded skill, `gh stack init` from an agent worktree, the advisor firing inside a Sonnet subagent, and the `/goal` judge reading the board through `gh` output.
- **Stacking sub-issues of one parent** - today each `fix-issue` worktree starts its own stack; sub-issues that build on each other should land as layers of one stack. Waits on the first run showing the branch shape.

## Later

- **A `Ready for review` board column** - the built-in automations only know `Done` on merge; a fourth column needs an option added in the GitHub UI and one more `item-edit` in `fix-issue`.
- **Whole-parent review** - `/code-review` runs per PR; a review of the parent's stack as one diff is a `claude ultrareview <base>` once the stack is complete.

## Shipped

- **#182-#186 Simplification** - the plugin rebuilt on built-ins: six skills, one agent, templates; the tasks server, dispatch loop, builder charter and 20k lines of prose retired.
