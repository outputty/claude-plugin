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
- A README runs one spine, in order: title and one-liner, install, a minimal quickstart, core concepts, an API reference, one heading per standalone capability, real-world examples, then license.
  - Core concepts: a diagram only past three interacting parts, then one subsection per concept, each a sentence and one example.
  - API reference: one heading per exported type; its methods are one-line bullets, always the same shape: `` - **`.method(args)`** - description ending on a period.``
  - Depth that outgrows a section moves to its own doc, linked once as `See [Label](path)`, never inlined back.
- A runnable README example keeps its full imports and carries `<!-- compiles -->` above the fence; a shape that names something undefined carries `<!-- illustrative -->` instead, and neither claims to be the other.
- A compiling example's real output is a trailing comment on the call that produces it, never prose under the fence.
- A before/after comparison is one fence holding both sides, each opened by a comment naming its approach, not two fences side by side.
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
- Every doc and subdocument is readable in isolation: its intro sets the scene with enough context to act on the file alone.
- Architecture prose is terse: a paragraph states the rule, a diagram or a code example shows it; a flow, a stack or a boundary earns a diagram before more prose.
- `architecture.md` is a spine: a subsystem whose worked detail outgrows its section moves to `.claude/architecture/<part>.md`, linked from the spine, opened when the spine points there. `product.md` splits the same way, into `.claude/product/<context>/<name>.md`, product terms only.

## Instruction files

Skills, rule files, agent definitions, templates and CLAUDE.md blocks, at either level:

- Every unit is a prescriptive line or paragraph: the action to take, at the moment it applies.
- A sequence or a bigger breakdown sits as bullets under the paragraph that prescribes it.
- An example or explanation is at most one sub-bullet under its line, added sparingly, only where the line alone would be misread.
