---
name: <name>
description: <what the skill holds or does, and when a session needs it, in the words a ticket would use. Third person, no angle-bracket tag.>
---

# <name>

A skill takes one of two shapes. A line says only what to do or not do: no why, no symptom, no tool tag in parentheses; the section names the tool. A snippet goes in only where it helps, as its own file under the skill's `references/`, linked from its line with a relative markdown link. No `SKILL.md` body holds a fenced block. A fixed output the skill prints comes from a template file in its `references/`. Every term that is not plain English gets one Glossary line. A domain skill names no project's code or data.

## The domain shape

A domain skill lists a domain's traps: a bare `# <name>` title, one `## <tool or topic>` section per tool or topic, then the Glossary.

```markdown
## <tool or topic>

### Do

- <what to do>: [references/<snippet>](references/<snippet>)

### Don't

- <what not to do>

## Glossary

- **<Term>** - <definition>.
```

## The procedure shape

A procedure skill is one a session runs step by step: the Input/Output line, then Steps, then a mode section when it has one (`## Under a /goal`, `## Upgrading`), Do, Don't and the Glossary.

```markdown
# <name>

Input: <what it takes>. Output: <what it hands back>.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. <the step>
  - Stop at <a stop condition>: <what to do>.
- [ ] 2. Report in the shape of [references/report.md](references/report.md).

## Do

- <what to do>

## Don't

- <what not to do>

## Glossary

- **<Term>** - <definition>.
```

documentation holds one `## <topic>` section per topic, each with `### Do` and `### Don't`, then `## Validate`, a `- [ ]` checklist run against one file or section, then the Glossary; it has no Steps.
