---
name: audit
description: Audits a codebase, or the folders the user names, against every code rule in force - the general code rules, the rule file of each language in scope and the repo's own glossary - and reports each discrepancy with its file and line, each unclear case as a question for the user, and a refactor plan. Read-only, and it assumes nothing. Use as /audit followed by folders or files, or on "audit this", "check the code against the rules", "find what breaks our rules".
argument-hint: "[<folder or file> ...]"
---

# audit - every rule, every file, no assumptions

Input: the folders or files the user names. Output: one report in the reply with the findings, the questions and a refactor plan. The audit edits nothing and files nothing; the user decides how the plan is actioned.

1. **Assume nothing.** A case the rules do not settle, code whose purpose is unclear, or anything broken met on the way is a question, never a finding. Every question goes to the user, and the scan goes on meanwhile.
2. **Every rule, in its own words.** Read the rules from their files at the start and quote each one in its finding; skip none. A rule that cannot be checked in files is listed as not checked, with the reason.
3. **Facts before judgement.** What a tool can list or count comes from the tool: the compiler's declarations, the language server, the linter. A tool's count stands for a rule only after a probe on a known case shows it counts the way the rule does.

Copy this checklist into your first reply and tick each item as it lands:

```
- [ ] 1. Read the rules
- [ ] 2. Set the scope
- [ ] 3. List the facts
- [ ] 4. Read every file
- [ ] 5. Ask the questions
- [ ] 6. Report
```

## 1. Read the rules

1. Read `~/.claude/rules/code.md` whole. Its headings are the audit's rule groups: **Exploring**, **Structure**, **Classes**, **Fits in your head**, **Names**, **Docstrings and comments**, **Tests**. A heading found there and missing from this list is a rule group all the same.
2. Read the rule file of each language in scope, such as `~/.claude/rules/typescript.md`; each of its headings is a rule group too. A language with no rule file is held to the general rules alone, and the report says so.
3. Read the project's `CLAUDE.md` and the rule files it names for the repo; each of their headings is a rule group. Its **Language** section is the first source of names. Where the file disagrees with a rule, it wins and the report names the line.
4. Take the standing lines the session started with. List each line that rules how a session behaves as not checked, with **Exploring**. Check each line that rules what is written in the code's comments and docstrings. **Exploring** still rules how the audit itself looks code up.
5. Write every rule into the reply as one line: its group and its opening words. That list is the checklist the report answers, rule by rule.

## 2. Set the scope

1. The scope is what the user named. With nothing named, ask which folders with one `AskUserQuestion`, offering the places the project's `CLAUDE.md` gives for source and tests.
2. List the files in scope by language. Generated, vendored and built files are left out; the report names what was left out.
3. A scope too large to read in one session is split by folder, one fresh reader agent each. Its brief gives the paths of the rule files, its files, the facts from step 3 and the shape of a finding and of a question; it edits nothing, assumes nothing and returns its questions. Open a sample of each reader's findings in the file before trusting the rest.

## 3. List the facts

List what a tool can state before judging anything, with the command that produced it:

1. Each class's and module's public surface, from the compiler's emitted declarations or the language server.
2. Each function's paths, lines and parameters, from a script or a probed tool.
3. The names declared for each type and each concept, tallied.
4. What the repo's linter and compiler already report.

Write the facts to a scratch file in the scratch folder the project's `CLAUDE.md` names.

## 4. Read every file

- **Structure**, **Docstrings and comments** and **Tests** are judged by reading, with references from the language server.
- **Classes** is judged from each class's public surface.
- **Fits in your head** is judged from the counts of step 3, and each step function is read to see whether it is a command or a query.
- **Names** is judged from the tally, against the **Language** section first.

Record each discrepancy as a finding, under the group of the rule it quotes: its `file:line`, the rule's own words, and what the code does instead, in one line. Record each unclear case as a question: its `file:line`, what is unclear, and the readings it could have. Something broken, such as code that does not compile, a test that cannot run or two files that contradict each other, is a question too; the audit neither fixes it nor works around it.

## 5. Ask the questions

Put every question to the user with `AskUserQuestion`, four per call, each naming its `file:line` and offering its readings as the options, with what each reading would make of the code. An answer turns the question into a finding or drops it. A question left open stays open in the report, and nothing that depends on it enters the plan. Where the session cannot ask, the report lists the questions instead.

## 6. Report

Reply under the style's headings:

- **Assumptions** - none of the auditor's own: each premise is a rule that was read or a fact that was listed, named with the tool that gave it.
- **Solution** - the findings by rule group, most widespread first, each with its `file:line` and the rule's words; then the verdict on every rule of step 1.5 (findings, none found, or not checked and why); then the refactor plan.

The refactor plan orders the refactors so each leaves the program working. Each names the findings it resolves, the files it touches, what must land before it, and a before and after in code. A refactor that rests on an open question is listed under **Next**, never in the plan.
