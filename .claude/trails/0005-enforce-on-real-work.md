# Trail — 0005-enforce-on-real-work

> Resolving the deferred #1 (gate the flow vs the session) per the user's directive:
> "whenever real work happens, it uses these tools."

## Thought-trail

- **User's call on #1:** enforce the tools on REAL WORK, not the session; read-only must never be
  blocked. And the audit showed a SessionStart hook is advisory — it can't actually deny tool calls.
- **New model.** The SessionStart hook now WARNS (names what's missing) and injects context; it no
  longer "refuses all work." A new **`require-environment` PreToolUse guard** (Edit|Write) DENIES
  file edits unless OpenWolf (`.wolf/`) + git (`.git`) are present — PreToolUse *can* deny. Dropped:
  the session-level advisory hard-block.
- **Split by cost.** The enforced per-edit rail checks only the CHEAP structural preconditions
  (`.wolf/`, `.git` — `fs.existsSync`, near-zero overhead). The expensive capability nuances
  (`openwolf --version`, `gh auth status`, GitHub origin) stay a once-per-session warning and are
  asserted by the flow when a feature starts (it needs the remote + `gh` for the draft PR).
- **Read-only stays free.** Read/Grep/Glob aren't matched, so browsing/answering in any repo works.
- **Net:** fixes the blast radius (read-only / CI / scratch repos no longer bricked) AND makes
  enforcement REAL (edits denied without the tools) instead of advisory. Known-open #1 closed.
