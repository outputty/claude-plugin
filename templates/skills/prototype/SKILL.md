---
name: prototype
description: Prototypes an idea or a ticket cheaply - a test first for every requirement, then the fastest wiring of patterns the repo already has, with anything new stubbed - onto a local prototype branch that /plan reads or /build continues. Use as /prototype followed by an idea or a ticket number, in its own Haiku session opened per the herdr skill, when the user wants to see it working before the shape is settled.
argument-hint: "<idea> | <ticket#>"
---

# prototype - see it working, cheaply

Input: an idea, or a ticket number. Output: a local branch `prototype/<name>` whose tests state every requirement and pass, with every new concept stubbed. `<name>` is the ticket number, or the idea in kebab case.

A prototype is the "I'll know when I see it" step: it shows the user the behaviour fast, built from what the repo already has. It runs in its own Herdr session and its own worktree, on Haiku, opened per the `herdr` skill; it never runs inside the session that asked for it. Every ticket and branch command is in the `tracker` skill.

Five rules hold for the whole session:

1. **Reuse only.** Copy and compose the nearest existing pattern. Invent no seam, type, abstraction or dependency.
2. **Stub anything new.** When a requirement needs a concept the repo lacks, hard-code or fake the smallest thing that makes its test pass, and mark that line `TODO: stub - <what the build must design>`. The marker is exact, so `rg -n "TODO: stub"` lists every stub.
3. **Least new work.** The shortest diff that passes the tests wins: no refactor, rename or cleanup.
4. **Local only.** Commit on `prototype/<name>`; never push, open a PR, or edit a ticket body. The build continues the branch in this same clone.
5. **Skip the build's gates.** No lint, typecheck, review, docs, build-story artifact or `advisor`. Run only the tests this prototype wrote or changed, and the tests beside them.

Its tests are real tests, not spike tests: they are committed on the branch, and the build keeps them.

Copy this checklist into your first reply and tick each item as it lands:

```
- [ ] 1. Read
- [ ] 2. Branch
- [ ] 3. Tests first
- [ ] 4. Wire it
- [ ] 5. Show it
- [ ] 6. Hand off
```

## 1. Read

1. A ticket: read its body, labels and comments per the `tracker` skill. Its Implementation criteria are the requirements, and its `## Solution` names the seam to wire into.
2. An idea: the user's words are the requirements. When they carry no end-to-end example (the call the user writes and the output they expect), ask for one with a single `AskUserQuestion`, your best guess as the first option.
3. Read the project's `CLAUDE.md` for where tests live and how they run. Then find the **Sibling**: the existing code nearest to the requirement, which the wiring copies.

## 2. Branch

Start `prototype/<name>` per the `tracker` skill's PRs: a ticket's from its planning branch, an idea's from `main`.

## 3. Tests first

1. Write one test per requirement, through the public entry point, the way the project's tests already do. When a requirement changes existing behaviour, change the test that pins it instead of adding one.
2. Run them. Each new or changed test fails, for the reason its requirement names. A test that already passes states nothing new: rewrite it, or report the requirement as already met.
3. Commit: `test(prototype): <requirement>`.

## 4. Wire it

1. Make each failing test pass by copying the Sibling's pattern, in the fewest lines.
2. A requirement that needs a new concept gets a stub per rule 2, and the wiring goes on.
3. Run the tests after each change. A test still failing after two attempts gets a stub too.
4. Commit as each test turns green: `feat(prototype): <what works now>`.

## 5. Show it

Run the end-to-end example, the user's or the ticket's, on the branch, and keep its real output. A UI change starts the dev or preview server with `--host 0.0.0.0` and prints its LAN URL.

## 6. Hand off

1. Commit everything. The worktree may be removed with its tab; only what is committed on `prototype/<name>` survives.
2. List the stubs with `rg -n "TODO: stub"`.
3. A ticket: record the branch on it per the `tracker` skill's PRs.
4. Report the branch, the example's real output, each test with pass or fail, and each stub with its `file:line` and what the build must design. Then name the next command: `/build <n>` for a ticket, or `/plan prototype/<name>` for an idea, where each stub is a decision for planning.
5. When the user says it is not what they meant, ask what they expected to see, change the tests first, and go again from step 3.
