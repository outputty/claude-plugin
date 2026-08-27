---
name: init
description: Wires outputty into a repo - installs the managed CLAUDE.md block, .claude/rules, the product docs, the issue and PR templates and the settings, then opens a PR. Run once, and again after a plugin upgrade. Idempotent.
disable-model-invocation: true
---

# init - install the templates

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/init/install.mjs"
```

Read what it prints: one line per file. The managed block in `CLAUDE.md` is always refreshed; every other file is created when absent and kept when present, because a present file carries the repo's own corrections. A kept file that differs from its template says so.

Then, by hand:

1. Add the repo's test, lint and typecheck commands to `permissions.allow` in `.claude/settings.json`.
2. Create the two labels the loop uses:

   ```bash
   gh label create ready --color 0e8a16 --force
   ```

   ```bash
   gh label create needs-decision --color d93f0b --force
   ```

3. Under **This repo** in `CLAUDE.md`, outside the markers, write the board line: `Board: <org>/<number> (project id <id>) · Status field <id>: Todo <id> · In Progress <id> · Done <id>`. The `github` skill's last section prints the ids.
4. Fill `.claude/product.md` (North Star, Language) with the user, and leave the other three docs to grow.
5. Commit on `chore/outputty-init` and open a PR. A worktree sees only what its base commit carries, so merge it before the first build.
