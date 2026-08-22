# Exercised on

This file records what exercised the plugin corpus: the harness, the model tier, and the Claude Code
version. A surface with no entry here is untested, whatever its own prose claims.

## The record

Each entry names the harness and the model tier, then its result. A filled entry carries the CLI version,
the date and the case score out of `aggregate-result.json`, never a summary of it.

1. **`node .claude/skills/run-outputty/driver.mjs`, no tier** - not run.
2. **Routing, meaning which skill fires for a request** - no harness.

**The output style is excluded, and carries no entry of its own.** The driver entry above covers the
shipped copy.

## When to re-test

- Re-run the wiring driver after any edit under `skills`, `agents` or `.claude-plugin`.
- An edit to a skill's `name` or `description` changes routing, which nothing measures. Say so in the PR.
- Record the tier, the version, the date and the result in the record above.
