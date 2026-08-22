# Safety and hardening

The plugin ships no hooks. An unattended session runs shell and git with no human present. Two
declarative mechanisms bound it: the `permissions` payload below, and the platform's own permission
classifier.

## The permission payload

Input: a consumer repo's `.claude/settings.json`, with whatever entries it already carries. Output: the
same file, with these entries merged in and the existing ones preserved.

```json
{ "permissions": {
  "defaultMode": "auto",
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

1. **Unattended by default** - `defaultMode: auto` makes every session in the repo unattended-capable,
   including one that outputty never started.
2. **Depth** - a `deny` rule matches at any depth. `Read(secrets/**)` covers a nested `secrets/`, and
   `Read(.env)` covers a nested `.env`.
3. **Templates** - `.env.example` is not listed, so a committed template stays readable.

## What the payload does not cover

1. **Content-level credential scanning** - a `deny` matches a path, never file contents. Use commit-time
   tooling such as `gitleaks` in the repo's own CI.
2. **A custom denial message** - a `deny` carries the platform's generic message.
3. **`NotebookEdit`** - the secret-path rules do not match it. It is left to the platform default.
