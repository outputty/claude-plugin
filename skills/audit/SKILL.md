---
name: audit
description: Audits a codebase, or the folders the user names, against every code rule in force - the general code rules, the rule file of each language in scope and the repo's own glossary - and reports each discrepancy with its file and line, each unclear case as a question for the user, and a refactor plan. Read-only, and it assumes nothing. Use as /outputty:audit followed by folders or files, or on "audit this", "check the code against the rules", "find what breaks our rules".
argument-hint: "[<folder or file> ...]"
---

# audit

Input: the folders or files the user names. Output: one report in the reply with the findings, the questions and a refactor plan, in the shape of [references/report.md](references/report.md). The audit edits nothing and files nothing; the user decides how the plan is actioned.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Read `~/.claude/rules/code.md` whole. Its headings are the audit's rule groups: **Exploring**, **Structure**, **Classes**, **Names**, **Docstrings and comments**, **Tests**. A heading found there and missing from this list is a rule group all the same.
- [ ] 2. Read the rule file of each language in scope, such as `~/.claude/rules/typescript.md`; each of its headings is a rule group too.
  - A language with no rule file is held to the general rules alone, and the report says so.
- [ ] 3. Read the project's `CLAUDE.md` and the rule files it names; each of their headings is a rule group. Its **Language** section is the first source of names.
  - Where the file disagrees with a rule, it wins and the report names the line.
- [ ] 4. Take the standing lines the session started with. List each line that rules how a session behaves as not checked, with **Exploring**. Check each line that rules what is written in the code's comments and docstrings.
- [ ] 5. Write every rule into the reply as one line: its group and its opening words. That list is the checklist the report answers, rule by rule.
- [ ] 6. Set the scope: what the user named. With nothing named, ask which folders with one `AskUserQuestion`, four per call, offering the places the project's `CLAUDE.md` gives for source and tests.
- [ ] 7. List the files in scope by language, leaving out generated, vendored and built files, and name what was left out.
  - A scope too large to read in one session is split by folder, one fresh reader agent each. Its brief gives the paths of the rule files, its files, the facts from step 8 and the shape of a finding and of a question; it edits nothing, assumes nothing and returns its questions.
- [ ] 8. List the facts a tool can state, each with the command that produced it, and write them to a scratch file in the scratch folder the project's `CLAUDE.md` names: each class's and module's public surface from the compiler's emitted declarations or the language server; the names declared for each type and concept, tallied; what the repo's linter and compiler already report.
- [ ] 9. Read every file. Judge **Structure**, **Docstrings and comments** and **Tests** by reading, with references from the language server; **Classes** from each class's public surface; **Names** from the tally, against the **Language** section first.
  - Record each discrepancy as a finding under the group of the rule it quotes, and each unclear case as a question, per the Do lines.
- [ ] 10. Put every question to the user with `AskUserQuestion`, four per call, each naming its `file:line` and offering its readings as the options, with what each reading would make of the code.
  - An answer turns the question into a finding or drops it. A question left open stays open in the report, and nothing that depends on it enters the plan.
  - Where the session cannot ask, the report lists the questions instead.
- [ ] 11. Report in the shape of [references/report.md](references/report.md).

## Do

- Hold that a case the rules do not settle, code whose purpose is unclear, or anything broken met on the way is a question, never a finding; the scan goes on meanwhile.
- Read the rules from their files at the start and quote each one in its finding.
- Look code up per **Exploring**, as the audit itself reads it.
- List a rule that cannot be checked in files as not checked, with the reason.
- Take what a tool can list or count from the tool, and probe it on a known case before its count stands for a rule.
- Record a finding as its `file:line`, the rule's own words, and what the code does instead, in one line.
- Record a question as its `file:line`, what is unclear, and the readings it could have.
- Order the refactor plan so each refactor leaves the program working, each naming the findings it resolves, the files it touches, what must land before it, and a before and after in code.
- List a refactor that rests on an open question under **Next**, never in the plan.

## Don't

- Don't skip a rule.
- Don't fix or work around something broken.

## Glossary

- **Standing lines** - the lines the plugin's SessionStart hook prints into every session.
- **Probe** - a run of a tool on a known case, to see that it counts the way the rule does.
- **Reader agent** - a fresh subagent that reads one folder against the rules and returns findings and questions.
- **Next** - the report's last heading, holding the open decisions.
