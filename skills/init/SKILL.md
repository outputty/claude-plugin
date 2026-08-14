---
name: init
description: Wire the outputty plugin into this repo — run once. Writes the managed outputty block into the project CLAUDE.md (orchestration charter, tier table, always-on conventions) and the secret-path permission entries into .claude/settings.json. Idempotent: re-run after a plugin upgrade to refresh the block. Run this before bootstrap.
---

# init — wire outputty into this repo

One job: make every session in this repo aware of outputty. You write two things and touch nothing
else. Both writes are idempotent — a second run changes nothing, and edits outside the managed block
survive.

## 1. The CLAUDE.md managed block

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
- The template carries the plugin version in its begin marker, so copying it verbatim re-stamps the
  version on every run. That is how an upgrade refreshes the block: re-run init.

Never edit inside the markers by hand — the next run overwrites the region. Put project notes outside
it.

## 2. The secret-path permissions

The plugin no longer ships file-guard hooks; the guard is declarative now. Merge these into
`.claude/settings.json` under `permissions`, preserving any entries already there. Adding a duplicate
is a no-op, so a re-run is safe.

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
- This is stricter than nothing and looser than the old hooks in two ways, on purpose: there is no
  content-level credential scan (use commit-time tooling for that), and a denial carries the platform's
  generic message rather than custom text.

## Then

Point the user at `bootstrap` if this repo has no `.claude/product.yaml` yet. init wires the plugin in;
bootstrap fills the product memory.
