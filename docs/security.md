# Safety and hardening

The scaffold copies no hooks into a repo; the plugin runs one, at session start, which only prints its standing lines. A build session runs shell and git under a `/goal` with the human present but not watching every turn. Declarative mechanisms bound it: the `permissions` payload below, and the platform's own permission classifier in `auto` mode.

## The permission payload

`templates/settings.json`, deep-merged into a repo's `.claude/settings.json` by `/outputty:init`. Arrays under `allow`, `deny` and `ask` union with what the repo already has.

```json
{
  "worktree": {
    "baseRef": "head"
  },
  "permissions": {
    "allow": ["Bash(git:*)", "Bash(gh:*)"],
    "deny": [
      "Read(.env)",
      "Edit(.env)",
      "Read(.env.local)",
      "Edit(.env.local)",
      "Read(secrets/**)",
      "Edit(secrets/**)",
      "Read(*.pem)",
      "Edit(*.pem)",
      "Read(*.key)",
      "Edit(*.key)",
      "Read(credentials.json)",
      "Edit(credentials.json)",
      "ScheduleWakeup"
    ],
    "ask": ["Bash(rm -rf:*)", "Bash(git clean -f:*)"]
  }
}
```

1. **Depth** - a `deny` rule matches at any depth. `.env.example` is not listed, so a committed template stays readable.
2. **The allowlist is committed** - `init` seeds `git` and the tracker's CLI, `gh`. `init` adds the repo's test, lint and typecheck commands at its last step. A worktree inherits it from its base commit.
3. **Permission mode** - not set by the scaffold; sessions opened through the `herdr` skill start in `bypassPermissions`. `auto` takes effect only from `~/.claude/settings.json` or managed settings.

## The build's bounds

1. **One build per worktree** (`claude --worktree ticket-<n>`); the primary checkout is edited only when you ask for a direct edit there.
2. **The goal line carries no turn cap**: `/goal clear` ends it at any time, and every session the `herdr` skill opens runs with `--permission-mode bypassPermissions`.
3. **A missing ruling is a question**, asked with `AskUserQuestion`, never a guess.
4. **Nothing merges** unless you said in the session to skip manual review, or a Haiku merge classifier reports no public API change, no possibly breaking functionality and no major refactor, and the merge does not deploy.

## What this does not cover

1. **Content-level credential scanning** - a `deny` matches a path only. Use `gitleaks` in CI.
2. **`NotebookEdit`** - the secret-path rules do not match it.
3. **The audit skill** - it is read-only by instruction, not by a permission.
4. **Advisor spend** - Fable as advisor bills to usage credits per call, with the whole transcript as input. Watch it with `/usage`.
