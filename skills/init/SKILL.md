---
name: init
description: Wires outputty into a repo - copies the managed CLAUDE.md block, .claude/rules, the issue and PR templates and the settings into the checkout, then opens a PR. Run once, and again after a plugin upgrade. Idempotent.
disable-model-invocation: true
---

# init - install the templates

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/init/install.sh"
```

Read what it prints: one line per file. It splices the block between the `outputty:begin` and
`outputty:end` markers in `CLAUDE.md` (or appends it), copies `templates/rules/*` to `.claude/rules/`,
the two templates to `.github/`, and deep-merges `templates/settings.json` into
`.claude/settings.json` (arrays under `allow`, `deny` and `ask` union; other keys are set).

Then, by hand:

1. Add the repo's test, lint and typecheck commands to `permissions.allow`.
2. Under **This repo** in `CLAUDE.md`, outside the markers, write the board line:
   `Board: <org>/<number> · Status <field id>: Todo <id> · In Progress <id> · Done <id>`. Get the ids
   with `gh project list --owner <org> --format json` and `gh project field-list <n> --owner <org>
   --format json`.
3. Commit on `chore/outputty-init` and open a PR. A worktree sees only what its base commit carries,
   so merge it before the first build.
