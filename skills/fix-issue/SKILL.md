---
name: fix-issue
description: Builds one GitHub issue to an open, reviewed PR in the current worktree. Invoked as /fix-issue <number>, or preloaded into the fix-issue agent whose prompt carries the number.
---

# fix-issue - one issue, one PR

`<n>` is the issue number: `$ARGUMENTS` on a slash invocation, or the number in the agent's prompt. One plain command per Bash call: read what it printed, then type that value into the next call.

## 1. Read the issue

```bash
gh issue view <n> --json title,body,labels
```

The body's **Done when** list is the contract. Every case is a check you will run. A ruling the body leaves open is a stop: comment the question on the issue, add the label `needs-decision`, remove yourself as assignee, and end your turn. A dispatched agent cannot ask.

An issue labelled `spike` ships no code: run the probe, post the findings as an issue comment, delete the probe, and end with `PR: none - spike, findings posted`.

## 2. Claim it

Load the `github` skill; every `gh` command below is spelled out there. Assign yourself, find the board item id for `<n>`, and set its Status to `In Progress`.

## 3. Build it

1. Read `.claude/product.md` and `.claude/architecture.md`, then the files the issue's **Where** and **Sibling** name, whole. `.claude/rules/code.md` is already in your context; it governs the diff.
2. Run the repo's test command once before the first edit. A red baseline is not yours to fix: note it in the PR and continue.
3. Write each **Done when** case as a failing test first.
4. Write the code that passes it, matching the sibling's shape.
5. Run the repo's test, lint and typecheck commands from its CLAUDE.md or manifest.

Call `advisor` before you commit to an approach, and again before you declare done.

## 4. Review once

Invoke the `Skill` tool with `skill: "code-review"`, effort `medium`. Fix findings that affect correctness or a **Done when** case; note the rest as skipped. Run the tests again. Then re-read `.claude/roadmap.md` and the parent issue, and state in one line whether this diff still serves them; a no is a stop condition.

## 5. Docs and retro

The docs ride the same PR:

1. An `architecture.md` entry marked `pending #<parent>` that this issue delivers is marked `done`; a seam this diff moved is rewritten.
2. `product.md`'s Language section is swept for any term or bullet this diff made stale.
3. An `examples.md` block whose output changed is re-run and its real output pasted.
4. When this PR closes the parent's last open sub-issue, the parent's paragraph in `roadmap.md` moves under **Shipped**, naming the PRs.

Then run the `retro` skill on this build; a rule it writes lands in `.claude/rules/` inside this PR. The PR template's **Docs** line names what changed or says `none`.

## 6. Ship

Commit on the branch you are on, with the issue number in the subject: `<title> (#<n>)`. Then read the branch name and adopt it as a stack, per the `github` skill:

```bash
git branch --show-current
```

```bash
gh stack init <the branch it printed>
```

```bash
gh stack submit --auto
```

Then `gh pr edit <pr#>` with a body from `.github/PULL_REQUEST_TEMPLATE.md` that carries `Closes #<n>`. End your turn with one line: `PR: <url>`. Do not merge.

## Stop conditions

Each ends with a comment on the issue, the `needs-decision` label, your assignee removed, and `PR: none - <reason>`.

- A fix that fails twice after a real diagnosis: both diagnoses and the second fix in the comment.
- A file needed outside the issue's **Where** folder.
- A review finding that reaches outside the **Where** folder.
- The diff no longer serves the parent or the roadmap.
