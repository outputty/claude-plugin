# Safety and hardening

outputty's BUILD phase runs shell and git autonomously, so PreToolUse hooks enforce guardrails the
delegated tools do not provide. All six are registered in `hooks/hooks.json`.

## Shipped guards (automatic)

- **`block-dangerous-commands`** (Bash) - denies `rm -rf /`, `reset --hard`, `git clean --force`,
  force-push, `chmod 777`, piped remote execution (`curl … | bash`), and
  `DROP`/`TRUNCATE`/`DELETE`-without-`WHERE`; asks on push-to-main.
- **`guard-secret-files`** (Read, Edit, Write) - denies reads and writes of `.env`, `secrets/`, `*.pem`,
  `*.key`, `credentials.json`. Allows `.env.example`, `.sample`, `.template` and `.dist`.
- **`scan-secrets`** (Edit, Write) - asks on credential patterns in file contents.
- **`require-environment`** (Edit, Write) - denies file edits outside a git repository. Read-only work is
  never blocked.
- **`write-boundary`** (Edit, Write) - denies an **orchestrator** session any edit outside `.claude/**`,
  `docs/**` and `README.md`, and denies `.claude/trails/**` inside that allowlist. Every other role exits
  silently. The trail and the task graph belong to the session that grilled them.
- **`reading-floor`** (Bash, Grep, Read) - denies `outputty:outputty-master-qa` a fragment read of a file
  that is in the diff. A grep outside the changed set is never denied. Every other agent, and the main
  session, exits silently.

Neither secret hook reads `notebook_path`, so a `NotebookEdit` payload is not scanned. Measured across
1,622 transcripts, `NotebookEdit` was called zero times.

## Defense in depth (opt-in)

A plugin cannot ship permissions, so add a secret-file deny-list to your own `settings.json`:

```json
{ "permissions": { "deny": [
  "Read(**/.env)", "Read(**/.env.*)", "Read(**/secrets/**)", "Read(**/*.pem)", "Read(**/*.key)", "Read(**/credentials.json)",
  "Write(**/.env)", "Write(**/secrets/**)", "Edit(**/.env)"
] } }
```

This is stricter than the `guard-secret-files` hook - it also blocks `.env.example` templates. Drop
`Read(**/.env.*)` if you need templates readable.
