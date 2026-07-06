# Safety & hardening

outputty's BUILD phase runs shell and git autonomously, so PreToolUse hooks enforce guardrails the
delegated tools don't provide.

## Shipped guards (automatic)

- **`block-dangerous-commands`** — denies `rm -rf /`, `reset --hard`, force-push, and
  `DROP`/`DELETE`-without-`WHERE`; asks on push-to-main.
- **`scan-secrets`** — asks on credential patterns in file writes.
- **`guard-secret-files`** — denies reads/writes of `.env`, `secrets/`, `*.pem`, `*.key`,
  `credentials.json` (allows `.env.example`/`.sample`/`.template`).
- **`require-environment`** — denies file edits unless OpenWolf + git are present.

## Defense in depth (opt-in)

A plugin can't ship permissions, so add a secret-file deny-list to your own `settings.json`:

```json
{ "permissions": { "deny": [
  "Read(**/.env)", "Read(**/.env.*)", "Read(**/secrets/**)", "Read(**/*.pem)", "Read(**/*.key)", "Read(**/credentials.json)",
  "Write(**/.env)", "Write(**/secrets/**)", "Edit(**/.env)"
] } }
```

This is stricter than the `guard-secret-files` hook — it also blocks `.env.example` templates. Drop
`Read(**/.env.*)` if you need templates readable.
