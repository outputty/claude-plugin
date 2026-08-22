# Exercised on

This file records what exercised the plugin corpus: the harness, the model tier, and the Claude Code
version. A surface with no entry here is untested, whatever its own prose claims.

## The record

Each entry names the harness and the model tier, then its result. A filled entry carries the CLI version,
the date and the case score out of `aggregate-result.json`, never a summary of it.

1. **`claude plugin eval` over `evals`, tier 1** - not run.
2. **`claude plugin eval` over `evals`, tier 2** - not run.
3. **`claude plugin eval` over `evals`, tier 3** - not run.
4. **`claude plugin eval` over `evals`, tier 4** - not run.
5. **`node .claude/skills/run-outputty/driver.mjs`, no tier** - not run.

Which model each tier names lives in the tier roster in `skills/orchestrate/SKILL.md`. The gate self-test
for `claude plugin eval` lives in [the suite README](../evals/README.md).

**The output style is excluded, and carries no entry of its own.** The driver entry above covers the
shipped copy.

## When to re-test

- Re-run the routing suite after any edit to a skill's `name` or `description`.
- Re-run the wiring driver after any edit under `skills`, `agents` or `.claude-plugin`.
- Record the tier, the version, the date and the result in the record above.
