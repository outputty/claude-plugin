---
name: prototype
description: "Prototypes an idea or a ticket on a prototype branch: tests first, existing patterns, anything new stubbed. Use as /prototype, or when asked to prototype an idea, or to see one working before it is planned."
argument-hint: "<idea> | <ticket#>"
---

# prototype

Input: an idea, or a ticket number. Output: a branch `prototype/<name>` on GitHub whose tests state every requirement and pass, with every new concept stubbed. `<name>` is the ticket number, or the idea in kebab case.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Read the requirements. A ticket: read its body, labels and comments per the `tracker` skill; its `## Solution` and its Implementation criteria are the requirements. An idea: the user's words are the requirements.
  - When an idea carries no end-to-end example, ask for one with `AskUserQuestion`, four per call, your best guess as the first option.
- [ ] 2. Find the Sibling.
- [ ] 3. Start `prototype/<name>` from `main` per the `tracker` skill.
- [ ] 4. Write the tests first: one per requirement, per the code rules' **Tests**. When a requirement changes existing behaviour, change the test that pins it instead of adding one.
- [ ] 5. Run them. Each new or changed test fails, for the reason its requirement names.
  - Stop at a test that already passes: rewrite it, or report the requirement as already met.
- [ ] 6. Commit: `test(prototype): <requirement>`.
- [ ] 7. Wire it: make each failing test pass by copying the Sibling's pattern, in the fewest lines. Run the tests after each change, and commit as each test turns green: `feat(prototype): <what works now>`.
  - When two existing patterns give about the same diff and which is better is unclear, such as the faster one or the cleaner design, name the observable that would decide it and offer a trial. On the user's yes, run one trial fork per pattern, each judged on that observable. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit. Cherry-pick the winning trial's commit from the branch its result names, and remove every fork's worktree. Without a yes, copy the simpler pattern. A choice the nearest code or the diff size already settles is no judgement call; try nothing else.
  - Stub a test still failing after two attempts.
- [ ] 8. Run the end-to-end example, the user's or the ticket's, on the branch, and keep its real output. A UI change starts the dev or preview server with `--host 0.0.0.0` and prints its LAN URL.
- [ ] 9. Commit everything, publish the branch, and list the stubs per the `tracker` skill.
- [ ] 10. A ticket: set its **Base** to the branch per the `tracker` skill.
- [ ] 11. Report in the shape of [references/report.md](references/report.md).
  - When the user says it is not what they meant, ask what they expected, and go again from step 4.

## Do

- Copy and compose the nearest existing pattern.
- Stub a concept the repo lacks: hard-code or fake the smallest thing that makes its test pass, and mark that line exactly `TODO: stub - <what the build must design>`.
- Take the shortest diff that passes the tests.
- Commit only on `prototype/<name>`, the tests included as real tests.

## Don't

- Don't invent a seam, type, abstraction or dependency.
- Don't refactor, rename or clean up.
- Don't open a PR, or edit a ticket body beyond its **Base** line.
- Don't run lint, typecheck, review or docs, publish a build-story artifact, or call `advisor`.

## Glossary

- **Sibling** - the existing code nearest to the requirement, which the wiring copies.
- **Stub** - a hard-coded or faked line marked `TODO: stub - <what the build must design>`; a build replaces it.
- **Seam** - the place in the code where new behaviour plugs in.
- **Base** - the ticket's line naming the branch the build starts from.
- **Observable** - the measurement that decides between two patterns, such as run time.
- **Trial fork** - a subagent that builds one pattern in its own worktree, judged on the observable.
- **Build-story artifact** - the page a build session publishes about what it built.
- **`advisor`** - the stronger reviewer model a session can consult.
