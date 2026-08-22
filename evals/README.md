# Routing evals

This suite asks one question per case: does a real user request reach the right skill? Each case sends a
prompt that never names a skill. Its graders assert which skill the `Skill` tool fired.

⚠ **No case here has ever been run.** No score and no baseline exist for this plugin. The suite is
committed unrun.

## Run it

```bash
claude plugin eval . --ablation none
```

- Run the command from the repository root.
- Add `--case routes-audit` to run one case.
- Add `--model <id>` to pin the model, because an unpinned run never records which model answered.

The `--ablation none` flag keeps the `Skill` graders inside the score. A baseline arm drops them instead,
since a skill cannot fire without its plugin.

⚠ **The command is gated per organization.** Claude Code 2.1.239 prints `plugin eval is currently in early
access` until the organization is enabled. Self-test: run `claude plugin eval` in an empty directory. The
reply `No eval cases found` means that the gate is open.

## What each case covers

| Case | Request | Must fire | Must not fire |
| --- | --- | --- | --- |
| `routes-audit` | ranked repository findings | `audit` | `qa`, `documentation` |
| `routes-bootstrap` | product memory for a brownfield repo | `bootstrap` | `audit`, `documentation` |
| `routes-build` | a settled task taken to a merge | `build` | none |
| `routes-diagram` | the architecture as a committed SVG | `diagram` | none |
| `routes-documentation` | a README rewritten out of slop | `documentation` | `audit` |
| `routes-grill` | the holes in a service split | `grill` | `planning` |
| `routes-issue-authoring` | an issue body for a new task | `issue-authoring` | `planning`, `qa` |
| `routes-orchestrate` | the ready queue dispatched | `orchestrate` | none |
| `routes-planning` | a feature specced before any code | `planning` | `grill`, `issue-authoring`, `build` |
| `routes-qa` | a merge verdict on a drained stack | `qa` | `audit` |

Every entry under **Must not fire** restates a claim that the skill's own description already makes. The
graders test those descriptions, not a new opinion.

## What the suite does not cover

| Skill | Why it has no case |
| --- | --- |
| `adversary`, `init`, `scout` | `disable-model-invocation: true` blocks description routing |
| `code-rules` | The CLAUDE.md outputty block loads it, and no eval sandbox carries that block |

Phrasings that no case covers yet are collected in [candidate cases](candidates.md), together with the
manual `qa` behaviour scenarios. That file is a backlog, never a second runner.

Behaviour is out of scope. A case grades which skill fired, never whether the stage finished. Each case
grants read-only tools only, so a skill that needs `git`, `gh` or the tasks server stops early. The `Skill`
call has already happened by then.

## Where results go

Each run writes `aggregate-result.json` and `report.html` under a timestamped directory in `evals/results`.
Record every run in [the exercised-on record](../docs/exercised-on.md).
