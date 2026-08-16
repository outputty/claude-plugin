# Safety and hardening

outputty's BUILD stage runs shell and git autonomously. As of 0.54.0 the plugin ships **no hooks** —
the guardrails are **declarative permissions** that `/outputty:init` writes into the consumer repo's
`.claude/settings.json`, plus the platform's own permission classifier.

## What init writes

Run `/outputty:init` once per repo. It merges these into `.claude/settings.json`, preserving any
entries already there:

```json
{ "permissions": {
  "deny": [
    "Read(.env)", "Edit(.env)", "Write(.env)",
    "Read(.env.local)", "Edit(.env.local)", "Write(.env.local)",
    "Read(secrets/**)", "Edit(secrets/**)", "Write(secrets/**)",
    "Read(*.pem)", "Edit(*.pem)", "Write(*.pem)",
    "Read(*.key)", "Edit(*.key)", "Write(*.key)",
    "Read(credentials.json)", "Edit(credentials.json)", "Write(credentials.json)"
  ],
  "ask": [ "Bash(rm -rf:*)", "Bash(git clean -f:*)" ]
} }
```

A `deny` rule matches at any depth, so `Read(secrets/**)` covers a nested `secrets/` and `Read(.env)`
covers a nested `.env`. A committed template such as `.env.example` is not listed, so it stays
readable.

## What changed from the hook era, and why

Before 0.54.0 the plugin shipped six PreToolUse hooks. They were removed because they fought the
platform — the permission classifier blocked edits to the guard scripts — and an audit found two of the
gates were passable by accident. The guarantees now come from three places:

- **Secret-file access** → the `deny` rules above. Same paths the `guard-secret-files` hook covered.
- **Destructive commands** (`rm -rf`, `git clean -f`) → the `ask` rules above, plus the platform
  classifier, which already blocks the worst cases.
- **The master-QA reading discipline** (whole files, no fragment reads of the diff) → stated in the
  `qa` skill, enforced by the reviewer following it rather than by a hook.

Two things the hooks did have **no declarative equivalent** and were dropped on purpose:

- **Content-level credential scanning** (the old `scan-secrets` hook, which read file *contents*). Use
  commit-time tooling such as `gitleaks` in the repo's own CI if you need it.
- **Custom denial messages.** A permission `deny` carries the platform's generic message, not the
  hook's tailored one.

## Notebooks

`NotebookEdit` is not covered by the secret-path rules. Measured across 1,622 transcripts it was called
zero times, so it is left to the platform default.
