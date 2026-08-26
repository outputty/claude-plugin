---
name: init
description: "Wire the outputty plugin into this repo - run once. Cuts a branch, writes the managed outputty block into the project CLAUDE.md, installs the output style, registers the tasks MCP server in .mcp.json, then writes the permission mode, the flow allowlist and the secret-path deny entries into .claude/settings.json. The permission mode is repo-wide: it makes every session in this repo run unattended-capable. Commits all four files and opens a PR. Idempotent: re-run after a plugin upgrade to refresh the block. Run this before bootstrap."
disable-model-invocation: true
---

# init - wire outputty into this repo

One job: make every session in this repo aware of outputty. Write four files and touch nothing else. Every
write is idempotent.

Output: the four files committed on `chore/outputty-init`, and a PR open against the default branch.

⚠ **A child session sees only what the base commit carries.** So init works on its own branch, commits
all four files, and opens a PR that has to merge before the first dispatch.

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

- **Resolve the default branch from the remote**, and use what it returns.
- Remember the name that `echo` printed. Step 6 opens the PR against it, and each command here runs in its
  own shell.
- If `set-head` cannot reach the remote, ask `gh` instead:
  `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. Prefix its answer with `origin/`.
- Cut from the remote ref. If `chore/outputty-init` survives an earlier run, check it out and update it
  in place.

## 2. Write the four files

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/init/scripts/install.sh"
```

**Execute that script**, and read its printed output rather than the script itself. A hand-retyped block
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
- **Put project notes outside the `CLAUDE.md` markers**, where the splice leaves them untouched. Anything
  inside is rewritten on the next run.
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

## 4. The permission mode and the permissions payload

The written `allow`, `deny` and `ask` payload, and what it does not cover, live in
`${CLAUDE_PLUGIN_ROOT}/docs/security.md`.

- **`defaultMode: auto`** makes every session in this repo run unattended-capable. It governs tool calls
  alone: the `tasks` server's own approval is the one-time prompt under `## Then`.
- The `deny` list still applies. `auto` is not `bypassPermissions`.
- **`ask`** pauses for the user on a broadly destructive command. It is best-effort, not a hard boundary.
- **`allow`** seeds the flow's own commands, `git` and `gh`. Now add the repo's test, build and lint
  commands (the `CHECKS` set, from the manifest scripts or `CLAUDE.md`) to the same list. Step 6 commits
  the file, so every worktree inherits the allowlist from its base commit and a build prompts for nothing.

## 5. The tasks MCP server

Task management runs through the **`tasks` MCP server**
([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)). The script registers it in the project's
`.mcp.json` as `npx -y @outputty/tasks-mcp`.

- **The local cache moves when this machine writes through the server.** An issue closed or relabelled
  in the GitHub web UI reaches it on the next `sync`. That is a setup call: see the seeding step under
  `## Then`.
- Nothing installs the server: `npx` (or `bunx`) fetches and runs it on demand, and no process stays alive.
- It reads the repo's `origin` remote and the user's `gh` or `GITHUB_TOKEN` credentials to reach GitHub.
- The kanban board needs the token's `project` scope (`gh auth refresh -s project`). Without it, tasks still
  land as issues, and only the board sync is skipped.

## 6. Commit all four, and open the PR

```bash
git add CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json
git status --porcelain CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json
```

**All four paths must come back staged.** A path that comes back empty was either not written, or
gitignored with `git add` saying nothing about it. Check that the file exists before you reach for
`git check-ignore -v <path>`, which names the rule that swallowed it. Fix `.gitignore` and stage that too,
so the rule stays visible to the next file that hits it.

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

⚠ **This run wrote `.mcp.json`, and a session reads it at startup.** So the `tasks` tools are absent
here. Tell the user to restart Claude Code in this repo, and to work from that session:

```bash
claude
```

**That session approves the `tasks` server once, at its prompt.** A project-scoped server waits at
`⏸ Pending approval` until an interactive run accepts it. The first interactive run in a fresh clone
is what turns the tools on.

⚠ **Have that session seed the cache**, when this repo already carries outputty issues - a re-init, or
a first clone on this machine. It calls `sync` `{ project }` once, before anything else. The cache
lives under the OS cache dir rather than in the repo.

Point the user at `bootstrap` if this repo has no `.claude/product.md` yet.
