# Exercised on

This file records what exercised the plugin corpus: the harness, the model tier, and the Claude Code
version. A surface with no row here is untested, whatever its own prose claims.

⚠ **No row below has a recorded run.** Every row is a slot that is waiting for its first result.

## The record

| Harness | Model tier | CLI version | Date | Result |
| --- | --- | --- | --- | --- |
| `claude plugin eval` over `evals` | 1 | - | DATE_TBD | not run |
| `claude plugin eval` over `evals` | 2 | - | DATE_TBD | not run |
| `claude plugin eval` over `evals` | 3 | - | DATE_TBD | not run |
| `claude plugin eval` over `evals` | 4 | - | DATE_TBD | not run |
| `node .claude/skills/run-outputty/driver.mjs` | none | - | DATE_TBD | not run |

Which model each tier names lives in the tier roster in `skills/orchestrate/SKILL.md`. A filled row carries
the case score out of `aggregate-result.json`, never a summary of it.

**The output style is deliberately excluded, and carries no exercised-on line of its own.**
`/outputty:init` installs it into a consumer repo, where this file does not exist, so a pointer from it
would dangle. The driver row above covers the shipped copy.

The suite was authored against Claude Code 2.1.239. No run has used that version yet, because the eval
command is gated. The gate self-test lives in [the suite README](../evals/README.md).

## When to re-test

- Re-run the routing suite after any edit to a skill's `name` or `description`.
- Re-run the wiring driver after any edit under `skills`, `agents` or `.claude-plugin`.
- Record the tier, the version, the date and the result in the table above.
