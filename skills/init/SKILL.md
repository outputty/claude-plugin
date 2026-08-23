---
name: init
description: Wire the outputty plugin into this repo - run once. Cuts a branch, writes the managed outputty block into the project CLAUDE.md, installs the output style, registers the tasks MCP server in .mcp.json, then writes the permission mode and the secret-path deny entries into .claude/settings.json. The permission mode is repo-wide: it makes every session in this repo run unattended-capable. Commits all four files and opens a PR. Idempotent: re-run after a plugin upgrade to refresh the block. Run this before bootstrap.
disable-model-invocation: true
---

# init - wire outputty into this repo

One job: make every session in this repo aware of outputty. Write four files and touch nothing else. Every
write is idempotent.

Output: the four files committed on `chore/outputty-init`, and a PR open against the default branch.

⚠ **A file init writes but never merges is a file no child session sees.** A worktree carries only what its
base commit carries. So init works on its own branch, commits all four files, and opens a PR.

## 1. Cut the branch, from a clean tree

```bash
git status --porcelain
```

⚠ **If that prints anything, stop.** Tell the user to commit or stash first, and run nothing else.
Uncommitted work either rides onto the init branch or breaks the checkout midway.

```bash
git fetch origin --prune
git remote set-head origin --auto
BASE=$(git symbolic-ref --short refs/remotes/origin/HEAD) && echo "$BASE"
git checkout -b chore/outputty-init "$BASE"
```

- **Never hardcode `origin/main`.** Resolve the default branch from the remote.
- Remember the name that `echo` printed. Step 6 opens the PR against it, and each command here runs in its
  own shell.
- If `set-head` cannot reach the remote, ask `gh` instead:
  `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. Prefix its answer with `origin/`.
- Cut from the remote ref, never from the local branch of the same name. If `chore/outputty-init` survives
  an earlier run, check it out and update it in place.

## 2. Write the four files

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/init/scripts/install.sh"
```

**Execute that script.** Never read it into context, and never redo its work by hand. A hand-retyped block
drifts, and nothing compares the installed block against the template.

The script writes:

1. **`CLAUDE.md`** - replaces the `<!-- outputty:begin … -->` region byte for byte, appends the block after
   a blank line, or creates the file.
2. **`.claude/output-styles/outputty.md`** - overwrites it from the plugin's copy.
3. **`.claude/settings.json`** - merges `outputStyle`, `worktree.baseRef` and the `permissions` object, and preserves every
   other key.
4. **`.mcp.json`** - merges the `tasks` server entry, and preserves every other server.

- **Expect a create, not an error, where a target is missing.** A repo with no `CLAUDE.md`, no
  `.claude/settings.json` or no `.mcp.json` gets each one written from empty.
- **Never edit inside the `CLAUDE.md` markers by hand.** Put project notes outside them, where the splice
  leaves them untouched.
- Read the line the script prints per file. It names which of the three `CLAUDE.md` paths it took.
- Fix an unparseable JSON target by hand, then run the script again. The merge stops rather than guess at
  broken JSON.
- Run `bash "${CLAUDE_PLUGIN_ROOT}/skills/init/scripts/selftest.sh"` if the script fails here. It
  exercises the installer against scratch repos, so a pass puts the fault in this repo.

## 3. The output style

The style's own rules live in `${CLAUDE_PLUGIN_ROOT}/skills/init/output-style.md`.

- The plugin owns `.claude/output-styles/outputty.md` and overwrites it on every run. A repo that wants its
  own style uses a different name.
- The `"outputStyle": "outputty"` entry in `.claude/settings.json` turns it on. Removing that entry opts
  the repo out, independently of the flow.
- The file's `keep-coding-instructions: true` appends to Claude Code's built-in coding instructions instead
  of replacing them.
- A main session loads it automatically, in the primary checkout and in every dispatched worktree alike. A
  subagent does not.

## 4. The permission mode and the secret-path permissions

The written `deny` and `ask` payload, and what it does not cover, live in
`${CLAUDE_PLUGIN_ROOT}/docs/security.md`.

- **`defaultMode: auto`** makes every session in this repo run unattended-capable. It also lets a
  project-scoped `.mcp.json` load at a worktree path that has no stored approval, and a child without that
  loses the `tasks` tools.
- The `deny` list still applies. `auto` is not `bypassPermissions`.
- **`ask`** pauses for the user on a broadly destructive command. It is best-effort, not a hard boundary.

## 5. The tasks MCP server

Task management runs through the **`tasks` MCP server**
([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)). The script registers it in the project's
`.mcp.json` as `npx -y @outputty/tasks-mcp --sync-interval 60`.

- The `--sync-interval 60` flag runs the background reconcile every minute. That is how a change made
  outside the machine reaches it: an issue closed in the web UI, or a label edited by hand. `0` (the
  default) turns it off.
- **The channel does not depend on that flag.** A worker session writes its note to a spool that the other
  servers *watch*. A task closing in a worktree wakes an idle session at once, reconcile loop or not.
- Nothing installs the server: `npx` (or `bunx`) fetches and runs it on demand, and no process stays alive.
- It reads the repo's `origin` remote and the user's `gh` or `GITHUB_TOKEN` credentials to reach GitHub.
- The kanban board needs the token's `project` scope (`gh auth refresh -s project`). Without it, tasks still
  land as issues, and only the board sync is skipped.

## 6. Commit all four, and open the PR

```bash
git add CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json
git status --porcelain CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json
```

**All four paths must come back staged.** A path that comes back empty was never written, or it is
gitignored and `git add` said nothing about it. Check that the file exists before you reach for
`git check-ignore -v <path>`, which names the rule that swallowed it. Fix `.gitignore` and stage that too.
Never reach for `git add -f`: it hides the rule, and the next file to hit it disappears the same way.

Read `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`, then:

```bash
git commit -m "chore: wire outputty into this repo"
git push -u origin chore/outputty-init
gh pr create --base <default branch> --title "chore: wire outputty into this repo" --body-file <path>
git checkout -
```

- Pass step 1's default branch to `--base`, without the `origin/` prefix.
- **The closing `git checkout -` returns the session to the branch it started on.** A primary checkout left
  on `chore/outputty-init` advances the wrong branch on the next fast-forward.

**Tell the user the PR must merge before the first dispatch,** and say so plainly if it is still open when
init finishes.

## Then

⚠ **The primary checkout's session needs a launch flag that nothing here can add.** Tell the user to start
that session with it, or no `<channel source="tasks">` event ever arrives:

```bash
claude --dangerously-load-development-channels server:tasks
```

Point the user at `bootstrap` if this repo has no `.claude/product.md` yet.
