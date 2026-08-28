# Safety and hardening

The plugin ships no hooks. A build session runs shell and git under a `/goal` with the human present but not watching every turn. Two declarative mechanisms bound it: the `permissions` payload below, and the platform's own permission classifier in `auto` mode.

## The permission payload

`templates/settings.json`, deep-merged into a repo's `.claude/settings.json` by `/outputty:init`. Arrays under `allow`, `deny` and `ask` union with what the repo already has.

```json
{
  "permissions": {
    "allow": ["Bash(git:*)", "Bash(gh:*)"],
    "deny": [
      "Read(.env)",
      "Edit(.env)",
      "Write(.env)",
      "Read(.env.local)",
      "Edit(.env.local)",
      "Write(.env.local)",
      "Read(secrets/**)",
      "Edit(secrets/**)",
      "Write(secrets/**)",
      "Read(*.pem)",
      "Edit(*.pem)",
      "Write(*.pem)",
      "Read(*.key)",
      "Edit(*.key)",
      "Write(*.key)",
      "Read(credentials.json)",
      "Edit(credentials.json)",
      "Write(credentials.json)"
    ],
    "ask": ["Bash(rm -rf:*)", "Bash(git clean -f:*)"]
  }
}
```

1. **Depth** - a `deny` rule matches at any depth. `.env.example` is not listed, so a committed template stays readable.
2. **The allowlist is committed** - `init` seeds `git` and `gh`; you add the repo's test, lint and typecheck commands. A worktree inherits it from its base commit.
3. **Permission mode** - not set by the plugin. `auto` takes effect only from `~/.claude/settings.json` or managed settings.

## The build's bounds

1. **One ticket per worktree** (`claude --worktree ticket-<n>`); the primary checkout is never edited.
2. **The goal line carries a turn cap** (`or stop after 60 turns`), and `/goal clear` ends it at any time.
3. **A missing ruling is a question**, asked with `AskUserQuestion`, never a guess.
4. **Nothing merges**; every PR is a draft until you merge it.

## What this does not cover

1. **Content-level credential scanning** - a `deny` matches a path only. Use `gitleaks` in CI.
2. **`NotebookEdit`** - the secret-path rules do not match it.
3. **Advisor spend** - Fable as advisor bills to usage credits per call, with the whole transcript as input. Watch it with `/usage`.
