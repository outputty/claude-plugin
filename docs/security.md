# Safety and hardening

The plugin ships no hooks. An unattended `fix-issue` agent runs shell and git with no human present.
Three declarative mechanisms bound it: the `permissions` payload below, the agent's turn cap, and the
platform's own permission classifier in `auto` mode.

## The permission payload

`templates/settings.json`, deep-merged into a repo's `.claude/settings.json` by `/outputty:init`. Arrays
under `allow`, `deny` and `ask` union with what the repo already has.

```json
{
  "permissions": {
    "allow": ["Bash(git:*)", "Bash(gh:*)"],
    "deny": [
      "Read(.env)", "Edit(.env)", "Write(.env)",
      "Read(.env.local)", "Edit(.env.local)", "Write(.env.local)",
      "Read(secrets/**)", "Edit(secrets/**)", "Write(secrets/**)",
      "Read(*.pem)", "Edit(*.pem)", "Write(*.pem)",
      "Read(*.key)", "Edit(*.key)", "Write(*.key)",
      "Read(credentials.json)", "Edit(credentials.json)", "Write(credentials.json)"
    ],
    "ask": ["Bash(rm -rf:*)", "Bash(git clean -f:*)"]
  }
}
```

1. **Depth** - a `deny` rule matches at any depth. `.env.example` is not listed, so a committed
   template stays readable.
2. **The allowlist is committed** - `init` seeds `git` and `gh`; you add the repo's test, lint and
   typecheck commands. A worktree inherits it from its base commit.
3. **Permission mode** - not set by the plugin. `auto` takes effect only from `~/.claude/settings.json`
   or managed settings.

## The agent's bounds

1. **`maxTurns: 60`** on `agents/fix-issue.md`. Output is marked partial at the cap.
2. **One issue per worktree** (`isolation: worktree`), cut from the build session's `HEAD`.
3. **No questions** - a subagent has no `AskUserQuestion`. A gap ends the turn with a comment and the
   `needs-decision` label.
4. **The `/goal` condition** carries a time or turn clause (`or stop after 8 hours`).

## What this does not cover

1. **Content-level credential scanning** - a `deny` matches a path only. Use `gitleaks` in CI.
2. **`NotebookEdit`** - the secret-path rules do not match it.
3. **Advisor spend** - Fable as advisor bills to usage credits per call, with the whole transcript as
   input. Watch it with `/usage`.
