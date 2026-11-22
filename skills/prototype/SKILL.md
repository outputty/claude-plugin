---
name: prototype
description: Prototypes an idea or a ticket cheaply - a test first for every requirement, then the fastest wiring of patterns the repo already has, with anything new stubbed - onto a local prototype branch that /outputty:plan reads or /outputty:build continues. Use as /outputty:prototype followed by an idea or a ticket number, in its own Haiku session opened per the herdr skill, when the user wants to see it working before the shape is settled.
argument-hint: "<idea> | <ticket#>"
---

# prototype - see it working, cheaply

Input: an idea, or a ticket number. Output: a local branch `prototype/<name>` whose tests state every requirement and pass, with every new concept stubbed. `<name>` is the ticket number, or the idea in kebab case.

A prototype is the "I'll know when I see it" step: it shows the user the behaviour fast, built from what the repo already has, so the shape, the inputs and outputs and any performance bottleneck are agreed before a build shapes the code to the rules. It runs in its own Herdr session and its own worktree, on Haiku, opened per the `herdr` skill. Every ticket and branch command is in the `tracker` skill.

These rules hold for the whole session:

1. **Reuse only.** Copy and compose the nearest existing pattern. Invent no seam, type, abstraction or dependency.
2. **Stub anything new.** When a requirement needs a concept the repo lacks, hard-code or fake the smallest thing that makes its test pass, and mark that line exactly `TODO: stub - <what the build must design>`.
3. **Least new work.** The shortest diff that passes the tests wins: no refactor, rename or cleanup. The code rules wait for the build.
4. **Local only.** Commit on `prototype/<name>`; never push, open a PR, or edit a ticket body.
5. **Skip the build's checks.** No lint, typecheck, review, docs, build-story artifact or `advisor`. Run only the tests this prototype wrote or changed, and the tests beside them.

Its tests are real tests, committed on the branch.

## 1. Read

1. A ticket: read its body, labels and comments per the `tracker` skill. Its Implementation criteria are the requirements, and its `## Solution` names the seam to wire into.
2. An idea: the user's words are the requirements. When they carry no end-to-end example, ask for one with a single `AskUserQuestion`, your best guess as the first option.
3. Find the **Sibling**: the existing code nearest to the requirement, which the wiring copies.

## 2. Branch

Start `prototype/<name>` per the `tracker` skill's PRs: a ticket's from its planning branch, an idea's from `main`.

## 3. Tests first

1. Write one test per requirement, per the code rules' **Tests**. When a requirement changes existing behaviour, change the test that pins it instead of adding one.
2. Run them. Each new or changed test fails, for the reason its requirement names. A test that already passes: rewrite it, or report the requirement as already met.
3. Commit: `test(prototype): <requirement>`.

## 4. Wire it

1. Make each failing test pass by copying the Sibling's pattern, in the fewest lines. When two existing patterns give about the same diff and which is better is unclear, such as the faster one or the cleaner design, name the observable that would decide it and offer a trial. On the user's yes, run one trial fork per pattern, one after the other, each judged on that observable. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit. Cherry-pick the winning trial's commit from the branch its result names, and remove every fork's worktree. Without a yes, copy the simpler pattern. A choice the nearest code or the diff size already settles is no judgement call; try nothing else.
2. Run the tests after each change. A test still failing after two attempts gets a stub, like a new concept.
3. Commit as each test turns green: `feat(prototype): <what works now>`.

## 5. Show it

Run the end-to-end example, the user's or the ticket's, on the branch, and keep its real output. A UI change starts the dev or preview server with `--host 0.0.0.0` and prints its LAN URL.

## 6. Hand off

1. Commit everything, and list the stubs per the `tracker` skill.
2. A ticket: record the branch on it per the `tracker` skill's PRs.
3. Report the branch, the example's real output, each test with pass or fail, and each stub with its file and what the build must design. Name the next command: `/outputty:build <n>` for a ticket, or `/outputty:plan prototype/<name>` for an idea.
4. When the user says it is not what they meant, ask what they expected, change the tests first, and go again from section 3.
