# Examples

The worked examples, all from one real ticket of this repo, #246 ("The plugin supplies its lines and its output style itself; init stops merging into CLAUDE.md"). Each block is quoted as it was filed or posted; a docs layer that changes a shape replaces the block with the next real one.

## A ticket's Implementation criteria

The shape `/outputty:plan` files and `/outputty:build` runs before it ends. The first of them, as filed on #246:

```markdown
- `templates/CLAUDE.user.md` moves to `hooks/context.md`, and `templates/output-styles/outputty.md` moves to `output-styles/outputty.md`, each as a pure move in its own commit before any edit.
- `hooks/context.md` holds the text in Solution, and stays under the 10,000-character cap that `hooks.md` sets.
- `output-styles/outputty.md` has `force-for-plugin: true` and keeps `keep-coding-instructions: true`.
- In a throwaway folder, `claude -p "Reply OK." --plugin-dir <repo>` writes a transcript holding a `hook_success` record whose content equals `hooks/context.md`, and an `output_style` attachment naming `<plugin>:outputty`, even when `--settings` sets `outputStyle` to `Explanatory`. Here `<plugin>` is the name `--plugin-dir` loads the repo under: the worktree folder's name, because the repo has no `plugin.json`. A marketplace install loads it as `outputty`.
```

## The goal line /outputty:tickets prints for it

The `tickets` skill's line, with the ticket's number in it:

```text
/goal ticket #246 is built by following /outputty:build 246: its PR is open and ready for review with the docs layer last and each Implementation-criteria case's real output pasted; or a question to the user is open and not yet answered; or stop after 60 turns
```

## The plan comment /outputty:build posts

The comment the build posted on #246 before its first edit:

````markdown
## Problem

Init writes the plugin's lines and style into files the user owns; the plugin will supply them itself through a SessionStart hook and a forced style.

## Assumptions

- A1-A8 in the ticket body - checked: each against `4210c41`, as listed there.

## Solution

```text
claude -p "Reply OK." --plugin-dir <repo>   // system turn "SessionStart:startup hook success: # outputty …", output style <plugin>:outputty
```

1. L1 - pure moves: `templates/CLAUDE.user.md` → `hooks/context.md`, `templates/output-styles/outputty.md` → `output-styles/outputty.md`, with the paths that read them - the move criterion
2. L2 - `hooks/hooks.json`, the audited `hooks/context.md`, `force-for-plugin: true`, and their tests - the hook, cap, compact, fork, opt-out and forced-style criteria
3. L3 - `skills/init/SKILL.md` merges and copies none of it, and its Upgrading removes the old copies on the user's yes - the init criteria
4. L4 - build's Gating step, herdr's worktree line, retro's reply route - the moved-lines and retro criteria
5. docs - this repo's `CLAUDE.md`, `README.md`, architecture, product, roadmap, the marketplace description, and the minor version bump

## Attempted

None.

## Next

L1 starts now.
````
