---
name: init
description: Wire the outputty plugin into this repo - run once. Cuts a branch, writes the managed outputty block into the project CLAUDE.md, installs the output style, registers the tasks MCP server in .mcp.json, writes the permission mode and secret-path entries into .claude/settings.json, then commits all four and opens a PR. Idempotent: re-run after a plugin upgrade to refresh the block. Run this before bootstrap.
---

# init - wire outputty into this repo

One job: make every session in this repo aware of outputty. Write four files, touch nothing else; every
write is idempotent.

⚠ **A file init writes but never merges is a file no child session sees.** Every child runs in a worktree,
and a worktree only contains what its base commit contains. An unmerged `.mcp.json` means no `tasks` tools;
an unmerged `CLAUDE.md` means no charter; an unmerged output style means no writing standard. Nothing warns
anyone. So init works on its own branch, commits all four files, and opens a PR.

## 1. Cut the branch

```bash
git fetch origin --prune && git checkout -b chore/outputty-init origin/main
```

Cut from `origin/main`, never the local `main`. If the branch already exists from an earlier run, check it
out and update it in place.

## 2. The CLAUDE.md block

The block carries the orchestration charter, the tier table, and the repo-specific conventions
(product-memory query catalogue, the flow, always-on rules).

Read the template and write it into the project `CLAUDE.md`:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/init/block.md"
```

- The template is the whole block, `<!-- outputty:begin … -->` through `<!-- outputty:end -->`.
- If `CLAUDE.md` already holds an `outputty:begin … outputty:end` region, **replace exactly that region**
  with the template, byte for byte. Leave every line outside it untouched.
- If there is no such region, append the template (a blank line before it). Create `CLAUDE.md` if the repo
  has none.

Never edit inside the markers by hand. Put project notes outside them.

## 3. The output style

The output style is outputty's writing and reasoning standard: how to engage, how to shape a response, what
language to use. It holds only rules that hold in any repo. Everything repo-specific lives in the block.

```bash
mkdir -p .claude/output-styles
cat "${CLAUDE_PLUGIN_ROOT}/skills/init/output-style.md" > .claude/output-styles/outputty.md
```

- Overwrite `.claude/output-styles/outputty.md` on every run; the plugin owns this file. A repo that wants
  its own style uses a different name.
- Merge `"outputStyle": "outputty"` into `.claude/settings.json`, preserving other keys. That line turns it
  on; removing it opts the repo out, independently of the flow.
- `keep-coding-instructions: true` in the file appends to Claude Code's built-in coding instructions instead
  of replacing them.
- A main session loads it automatically, in the primary checkout and in every dispatched worktree alike. A
  subagent does not, which is why each agent charter reads the file itself.

## 4. The permission mode and the secret-path permissions

Merge these into `.claude/settings.json` under `permissions`, preserving any entries already there. A
duplicate is a no-op.

```json
{
  "permissions": {
    "defaultMode": "auto",
    "deny": [
      "Read(.env)", "Edit(.env)", "Write(.env)",
      "Read(.env.local)", "Edit(.env.local)", "Write(.env.local)",
      "Read(secrets/**)", "Edit(secrets/**)", "Write(secrets/**)",
      "Read(*.pem)", "Edit(*.pem)", "Write(*.pem)",
      "Read(*.key)", "Edit(*.key)", "Write(*.key)",
      "Read(credentials.json)", "Edit(credentials.json)", "Write(credentials.json)"
    ],
    "ask": [
      "Bash(rm -rf:*)",
      "Bash(git clean -f:*)"
    ]
  }
}
```

- **defaultMode `auto`** makes every session in this repo run unattended-capable without the dispatcher
  having to remember a flag. Build sessions run in panes nobody is watching, so a session that stalls on a
  prompt produces nothing. It also lets a project-scoped `.mcp.json` load at a worktree path that has no
  stored approval - without it a child silently loses the `tasks` tools. The charter still passes
  `--permission-mode auto` on `agent start`; this is the floor under it, and it covers sessions started
  outside the charter too. The `deny` list still applies - `auto` is not `bypassPermissions`.
- **deny** matches at any depth, so `Read(secrets/**)` covers a nested `secrets/`, and `Read(.env)` covers a
  nested `.env`. A committed template like `.env.example` is not in the list, so it stays readable.
- **ask** pauses for the user on a broadly destructive command. It is best-effort, not a hard boundary.
- This is a coarse guard, on purpose: no content-level credential scan (use commit-time tooling for that),
  and a denial carries the platform's generic message.

## 5. The tasks MCP server

Task management runs through the **`tasks` MCP server**
([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)). Register it in the project's `.mcp.json`,
merging this and preserving any servers already there:

```json
{
  "mcpServers": {
    "tasks": {
      "command": "npx",
      "args": ["-y", "@outputty/tasks-mcp", "--sync-interval", "60"]
    }
  }
}
```

- `--sync-interval 60` runs the background reconcile every minute - this is how a change made outside
  the machine reaches it: an issue closed in the GitHub web UI, a label edited by hand. `0` (the default)
  turns it off.
- **The channel does not depend on that flag** (tasks-mcp ≥ 0.15.0). A worker session's note is written
  to a spool the other servers *watch*, so a task closing in a worktree wakes the orchestrator at once,
  reconcile loop or not. Keep the flag anyway for the GitHub-side reconcile; on an older tasks-mcp it is
  also the only thing that drains the spool, so dropping it there goes back to a dark channel.
- `npx` (or `bunx`) fetches and runs it on demand - no install step, no server to keep alive.
- It reads the repo's `origin` remote and the user's `gh` / `GITHUB_TOKEN` credentials to reach GitHub.
- The kanban board needs the token's `project` scope (`gh auth refresh -s project`); without it, tasks still
  land as issues and only the board sync is skipped.
- Every task tool takes a `project` argument - the absolute repo root the session is working in.

## 6. Commit all four, and open the PR

```bash
git add CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json
git status --porcelain CLAUDE.md .claude/output-styles/outputty.md .claude/settings.json .mcp.json
```

⚠ **All four paths must come back staged.** A path that comes back empty is gitignored, and `git add`
said nothing about it. `git check-ignore -v <path>` names the rule that swallowed it. Fix `.gitignore` and
stage that too. Never reach for `git add -f`: it hides the rule, and the next file to hit it disappears the
same silent way.

Read `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`, then:

```bash
git commit -m "chore: wire outputty into this repo"
git push -u origin chore/outputty-init
gh pr create --base main --title "chore: wire outputty into this repo" --body-file <path>
```

**Tell the user the PR must merge before the first dispatch,** and say so plainly if it is still open when
init finishes. Until it lands, every child session is cut without the block, the style, and the task tools.

## Then

Point the user at `bootstrap` if this repo has no `.claude/product.md` yet.
