---
paths:
  - "README.md"
  - "docs/**/*.md"
  - "CLAUDE.md"
  - ".claude/**/*.md"
  - "**/SKILL.md"
---

# Docs

- Concrete beats comprehensive: code first, prose second. A sentence true of a dozen other projects is cut.
- A README runs title and one-liner, requirements, install and quickstart, then two to four code-first examples as a ladder (minimal, real scenario, advanced in `<details>`), then how it works, then links only. Architecture comes after the reader has touched the code.
- Command fences drop the `$` prefix and keep output outside the fence.
- Each env var or flag is its own bullet, naming its default and whether it is required.
- In-repo links stay relative.
- Before a docs pass ends, every command, example and diagram is checked against the code as it now stands; a docs-only change is checked against behaviour, not format.
- A doc states its evidence as the run that produced it, never as a narration of what the file used to say. History lives in `git log`.
- A referenced file never restates what its reader already loads, and never narrates the file that points to it.
- A picture is earned by an architecture of three or more parts, a flow across a boundary, a state machine or a decision tree. Linear steps get a numbered list.
- An earned picture is inline Mermaid in any Markdown file, and a committed SVG only in `README.md` or a PR body, linked by `github.com/<owner>/<repo>/raw/<branch>/<path>`.
- An SVG is validated with a real XML parser before the commit; a malformed one renders as nothing.
- A flow change is explained as BEFORE and AFTER in the same shape.
- Past roughly 1500 lines, `architecture.md` splits into a spine plus `.claude/architecture/<part>.md`, each part linked from the feature index.

## Instruction files

Skills, rule files, agent definitions, templates and CLAUDE.md blocks, at either level:

- Every unit is a prescriptive line or paragraph: the action to take, at the moment it applies.
- A sequence or a bigger breakdown sits as bullets under the paragraph that prescribes it.
- An example or explanation is at most one sub-bullet under its line, added sparingly, only where the line alone would be misread.
