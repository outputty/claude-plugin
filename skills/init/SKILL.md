---
name: init
description: Wire the outputty plugin into this repo — run once. Writes the managed outputty block into the project CLAUDE.md (orchestration charter, tier table, always-on conventions), registers the tasks MCP server in .mcp.json, and writes the auto permission mode plus the secret-path permission entries into .claude/settings.json. Idempotent: re-run after a plugin upgrade to refresh the block. Run this before bootstrap.
---

# init — wire outputty into this repo

One job: make every session in this repo aware of outputty. Write three things, touch nothing else; every
write is idempotent.

## 1. The CLAUDE.md block and the output style

The block carries the orchestration charter, the tier table, and the always-on conventions (product-memory
query catalogue, writing standard, rules).

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

### The output style

Install the **output style** — outputty's communication and working standard — alongside the block.

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

## 2. The permission mode and the secret-path permissions

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
  prompt is a session that produces nothing. It also lets a project-scoped `.mcp.json` load at a worktree
  path that has no stored approval — without it a child silently loses the `tasks` tools. The charter still
  passes `--permission-mode auto` on `agent start`; this is the floor under it, and it covers sessions
  started outside the charter too. The `deny` list below still applies — `auto` is not `bypassPermissions`.
- **deny** matches at any depth, so `Read(secrets/**)` covers a nested `secrets/`, and `Read(.env)` covers a
  nested `.env`. A committed template like `.env.example` is not in the list, so it stays readable.
- **ask** pauses for the user on a broadly destructive command. It is best-effort, not a hard boundary.
- This is a coarse guard, on purpose: no content-level credential scan (use commit-time tooling for that),
  and a denial carries the platform's generic message.

## 3. The tasks MCP server

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

- `--sync-interval 60` runs the background reconcile every minute — this is how a change made outside
  the machine reaches it: an issue closed in the GitHub web UI, a label edited by hand. `0` (the default)
  turns it off.
- **The channel does not depend on that flag** (tasks-mcp ≥ 0.15.0). A worker session's note is written
  to a spool the other servers *watch*, so a task closing in a worktree wakes the orchestrator at once,
  reconcile loop or not. Keep the flag anyway for the GitHub-side reconcile; on an older tasks-mcp it is
  also the only thing that drains the spool, so dropping it there goes back to a dark channel.
- `npx` (or `bunx`) fetches and runs it on demand — no install step, no server to keep alive.
- It reads the repo's `origin` remote and the user's `gh` / `GITHUB_TOKEN` credentials to reach GitHub.
- The kanban board needs the token's `project` scope (`gh auth refresh -s project`); without it, tasks still
  land as issues and only the board sync is skipped.
- Every task tool takes a `project` argument — the absolute repo root the session is working in.

**Commit `.mcp.json`, and land it on the default branch before dispatching anything.** Every child session
runs in a worktree, and a worktree only contains what its base commit contains. While this file sits
untracked, or committed on a branch that has not merged, each child is cut without it and silently starts
with no task tools. Tell the user plainly if it is still unmerged when init finishes.

## Then

Point the user at `bootstrap` if this repo has no `.claude/product.md` yet.
