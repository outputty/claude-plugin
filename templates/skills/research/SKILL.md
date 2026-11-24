---
name: research
description: "Researches a topic with many agents, grills the user until every base is covered, validates the findings, and ends with a reference document under docs/research/. Use as /research, or when asked to research a topic before it is planned."
argument-hint: "<topic>"
---

# research

Input: a topic. Output: a reference document `docs/research/<slug>.md` in a PR the session opens, and no ticket. `<slug>` is the topic in kebab case.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Grill the user with `AskUserQuestion`, four per call, calls back to back: what the document must let `/plan` decide, what is already known, what is out of scope. Go on until every branch of the topic has an answer.
- [ ] 2. Split the topic into questions, and start one Haiku or Sonnet agent per question, briefed with its question, the sources it may read and the check that proves a finding. Each agent returns its findings with the source of each.
- [ ] 3. Sort the findings into categories with a Haiku agent.
- [ ] 4. Validate each finding against its source yourself. Redo, with a fresh agent, each question whose finding fails or cannot be validated.
- [ ] 5. Ask the user each question the findings raise, per step 1, and research the answers.
- [ ] 6. Write `docs/research/<slug>.md`: the topic, then each category with its findings, each with its source and how to validate it, then what stays unknown.
- [ ] 7. Commit it, push the branch, and open a PR per the `tracker` skill. Report the PR and the document's path.

## Do

- Run on Opus 5.5 with `--effort ultracode`, so the agents of step 2 run as one workflow.
- Name the source of every finding.
- Keep the document to current findings; history stays in the PR.

## Don't

- Don't file a ticket or edit one.
- Don't write a finding that failed validation into the document.
- Don't run an agent on a finding without its source.

## Glossary

- **Research session** - a session on its own worktree, opened per the `herdr` skill, that ends with a research document.
- **Research document** - `docs/research/<slug>.md`: findings by category, each with its source, which `/plan` can read.
- **Finding** - one fact an agent returns with its source.
- **Ultracode** - the Claude Code setting, started with `--effort ultracode`, that plans each task as a multi-agent workflow.
