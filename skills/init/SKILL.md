---
name: init
description: Wires outputty into a repo - installs the managed CLAUDE.md block, .claude/rules, the product docs, the issue and PR templates and the settings, then opens a PR. Run once, and again after a plugin upgrade. Idempotent.
disable-model-invocation: true
---

# init - install the templates

Every template lives under `${CLAUDE_PLUGIN_ROOT}/templates/`. Install each with `Read`, `Write` and `Edit`; run no shell for the copying. Print one line per file as you go, in the form `<path>: created | unchanged | kept, differs from <template> | block replaced | block appended`.

## 1. CLAUDE.md, the managed block

Read `templates/CLAUDE.block.md`. Then:

1. **No `CLAUDE.md`** - write the block as the file.
2. **Both markers present** (`<!-- outputty:begin` and `<!-- outputty:end -->`) - replace everything from the first marker through the second with the block. Text outside the markers stays byte for byte.
3. **No markers** - append a blank line and the block at the end.

## 2. Files created when absent, kept when present

A file the repo already has carries its own corrections, so it is never overwritten. Compare it to the template and report `unchanged` or `kept, differs`.

1. `templates/rules/{code,docs,issues}.md` → `.claude/rules/`
2. `templates/docs/{product,roadmap,architecture,examples}.md` → `.claude/`
3. `templates/ISSUE_TEMPLATE/task.md` → `.github/ISSUE_TEMPLATE/task.md`
4. `templates/PULL_REQUEST_TEMPLATE.md` → `.github/PULL_REQUEST_TEMPLATE.md`

## 3. `.claude/settings.json`, merged

Read `templates/settings.json` and the repo's file. Write the union: every key in the template is set; the arrays under `permissions.allow`, `permissions.deny` and `permissions.ask` are unioned with the repo's entries; every other key the repo has is preserved. A repo file that is not valid JSON is a stop: name the file and ask the user to fix it.

## 4. By hand, with the user

1. Add the repo's test, lint and typecheck commands to `permissions.allow`.
2. Create the three labels the flow uses:

   ```bash
   gh label create ready --color 0e8a16 --force
   ```

   ```bash
   gh label create priority:high --color b60205 --force
   ```

   ```bash
   gh label create needs-planning --color d93f0b --force
   ```

3. Under **This repo** in `CLAUDE.md`, outside the markers, write the board line: `Board: <org>/<number> (project id <id>) · Status field <id>: Todo <id> · In Progress <id> · Done <id>`. The `github` skill's last section prints the ids.
4. Fill `.claude/product.md` (North Star, Language) with the user; the other three docs grow on their own.
5. Commit on `chore/outputty-init` and open a PR. A worktree sees only what its base commit carries, so merge it before the first build.
