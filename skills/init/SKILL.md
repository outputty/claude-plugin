---
name: init
description: Wire the outputty plugin into this repo — run once. Writes the managed outputty block into the project CLAUDE.md (orchestration charter, tier table, always-on conventions), registers the tasks MCP server in .mcp.json, and writes the secret-path permission entries into .claude/settings.json. Idempotent: re-run after a plugin upgrade to refresh the block. Run this before bootstrap.
---

# init — wire outputty into this repo

One job: make every session in this repo aware of outputty. You write three things and touch nothing
else. Every write is idempotent — a second run changes nothing, and edits outside the managed regions
survive.

## 1. The CLAUDE.md block and the output style

The block is the plugin's one always-on surface: the orchestration charter, the tier table, and the
always-on conventions (product-memory query catalogue, writing standard, rules). Every session in the
repo loads it through CLAUDE.md, so this is how a main session learns to orchestrate and a dispatched
session learns to invoke its stage skill.

Read the template and write it into the project `CLAUDE.md`:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/init/block.md"
```

- The template is the whole block, `<!-- outputty:begin … -->` through `<!-- outputty:end -->`.
- If `CLAUDE.md` already holds an `outputty:begin … outputty:end` region, **replace exactly that
  region** with the template, byte for byte. Leave every line outside it untouched.
- If there is no such region, append the template (a blank line before it). Create `CLAUDE.md` if the
  repo has none.

Never edit inside the markers by hand — the next run overwrites the region. Put project notes outside
it.

### The output style

The same session-wide surface carries the **output style**: outputty's communication and working
standard, delivered through the system prompt rather than through CLAUDE.md. Install it alongside the
block.

```bash
mkdir -p .claude/output-styles
cat "${CLAUDE_PLUGIN_ROOT}/skills/init/output-style.md" > .claude/output-styles/outputty.md
```

- Overwrite `.claude/output-styles/outputty.md` on every run; the plugin owns this file. A repo that
  wants its own style uses a different name.
- Merge `"outputStyle": "outputty"` into `.claude/settings.json`, preserving other keys. That line
  turns it on; removing it opts the repo out, independently of the flow.
- `keep-coding-instructions: true` in the file means it appends to Claude Code's built-in coding
  instructions instead of replacing them.

## 2. The secret-path permissions

The secret-path guard is declarative. Merge these into `.claude/settings.json` under `permissions`,
preserving any entries already there. Adding a duplicate is a no-op, so a re-run is safe.

```json
{
  "permissions": {
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

- **deny** matches at any depth, so `Read(secrets/**)` covers a nested `secrets/`, and `Read(.env)`
  covers a nested `.env`. A committed template like `.env.example` is not in the list, so it stays
  readable.
- **ask** pauses for the user on a broadly destructive command. It is best-effort, not a hard boundary.
- This is a coarse guard, on purpose: no content-level credential scan (use commit-time tooling for
  that), and a denial carries the platform's generic message.

## 3. The tasks MCP server

Task management runs through the **`tasks` MCP server** ([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)),
which keeps the task graph and syncs it two-way to GitHub Issues (and a Projects board). Register it in
the project's `.mcp.json` so every session can call the task tools. Merge this, preserving any servers
already there:

```json
{
  "mcpServers": {
    "tasks": { "command": "npx", "args": ["-y", "@outputty/tasks-mcp"] }
  }
}
```

- `npx` (or `bunx`) fetches and runs it on demand — no install step, no server to keep alive.
- It reads the repo's `origin` remote and the user's `gh` / `GITHUB_TOKEN` credentials to reach GitHub.
- The kanban board needs the token's `project` scope (`gh auth refresh -s project`); without it, tasks
  still land as issues and only the board sync is skipped.
- Every task tool takes a `project` argument — the absolute repo root the session is working in.

## Then

Point the user at `bootstrap` if this repo has no `.claude/product.yaml` yet. init wires the plugin in;
bootstrap fills the product memory.
