<!-- outputty:begin - managed block. Edit only outside these markers; a rewrite replaces everything inside. -->

# Tools

- Prefer bun, rg, fd, sd and jq.

# Plan and build tabs

Read the last segment of `git rev-parse --show-toplevel`.

- If it is the repo's own name, this is the primary session. On a plan or build request, open a tab through the `herdr` skill and stop. When the user says "do it here", work in place.
- If it is `ticket-<n>` or `plan-<slug>`, you are that session. Run `/build <n>` or `/plan <…>` here.
- Create every worktree from the latest `main`. Run `git checkout main`, then `git pull`, or add the worktree from `origin/main` when the primary checkout holds other work.

# Code

- Reuse before writing: first what the repo has, then an installed library's own mechanism, then new code. A near-duplicate of existing code is a defect.
- Build the simplest thing for the documented usage. The caller owns misuse, so add no defensive guards or fallbacks.
- Report output as run only after it ran.
- Spike tests are never committed.
- Code comments say what the code is for. They carry no ticket numbers, history or measurements.
- Never run a deploy, a publish, or a merge that deploys unless the user says so in this session.

# Tickets and PRs

- A ticket opens with one plain problem paragraph. Then `## What should happen` shows one runnable end-to-end program, with real input, real output, and `// before` / `// after`.
- Implementation criteria state outcomes and runnable cases, and carry no file-scope restriction.
- Write issue and PR bodies one paragraph per line.
- Only the last PR of a stack names `Closes #n`. GitHub also closes on a negated keyword, so no other PR body puts a closing word next to `#n`.

<!-- outputty:end -->
