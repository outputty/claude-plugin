# skill-shape - plan record

The planning for the ticket "Rewrite every skill to one shape: Do and Don't by tool or topic, a Glossary, one file per snippet". Every outputty skill takes one shape: sections by tool or topic, each with Do and Don't lines, a Glossary, and one file per snippet.

## The hand-over

The decisions were made in a planning thread run from a laygo session, which could not run git in this repo. Its record follows as written, with the plan session's round 1 appended.

Every outputty skill takes one shape: sections by tool or topic, each with Do and Don't lines, a Glossary, and snippet files. Every decision below is the user's, made in a planning thread run from a laygo session (it could not run git in this repo). This file is the hand-over: draft the ticket from it, show the draft, and on the user's go file it with its planning PR.

Files beside this one:

- `skill-shape-catalogue.md` - every shape the 13 skills use today, each quote checked against its `file:line`, with the inconsistencies and the undefined terms per skill.
- `skill-shape-types-section.md` - the "Types that check fast" Do/Don't lines, as first written.
- `skill-shape-fast-types.ts` - their examples, one labelled block each (labels are now rejected; see Decisions 3).

#### The user's words, verbatim

1. "make changes to the claude plugin typescript skill to encapsulate the typing rules. It's super important! Capture everything in the form of Do and Don't. Don't should contain all examples that we had that raised memory usage crazy high and processing time went through the roof. Don't show old examples that don't relate to the aforementioned things. Do's should contain examples that we want."
2. "Simplify the skill. Keep only the absolutely most important content. I don't need context, history, how numbers grew or decreased. Just plain and simple do's and don'ts. Write them in simple, generic, technical english. Don't overexplain."
3. "Each do and don't should have a simple example referenced. It should be held in a ts file"
4. "Also you've used a lot of glossary-specific language. All skills must have a glossary section that define things like phantom properties. Apply my comments to this and other skills. I want clear do and don't sections + glossary + code snippets."
5. "Inspect all skills in the plugin and summarise shapes/prompt types you find in those skills. We'll pick what to keep."
6. On how a line reads: "1. You are talking specifically about ts-pattern. In such a case we need a ts-pattern section that contains its dos and don'ts with example snippet files referenced in the skill where necessary (not everywhere) 2. a case added later falls into it silently - this is useless. We don't need to know why. we need the what and how (snippet, which isn't mandatory in all cases). Why belongs in user facing documents. 3. labels aren't needed. We just need a way to reference the snippet."
7. On procedure skills (picked "numbered steps keep the order; session rules and traps become Do/Don't"): "Steps should be contained in a distinct section"
8. On the opening shapes: kept "Checklist to tick" and "Input/Output line"; not the `# name - tagline` title, not the premise paragraph.
9. On the process sections (picked mode sections, stop conditions, report spec, resume file): "I don't know what this is. We should have templates for common specs, outputs. Stop conditions should be a part of the processing flows that should be checklist based. If there are repeated code calls, those should be callable skills that should be referenced in the skill"
10. On the procedure shape: picked "Steps are the checklist".
11. On new callable skills: picked only "Update skill-template"; declined a `trial` skill (the trial-fork paragraph in build and prototype) and an `ask` skill (the question format).
12. On snippet references: "Don't reference lines. Each snippet is a single file."
13. Template home: "Ship in templates/". Grade: production grade. One PR, no stack. Filing: a plan tab in this repo.

#### Decisions

1. **Sections** - a skill's rules are grouped by tool or topic (`## ts-pattern`, `## Types that check fast`), each with `### Do` and `### Don't`.
2. **A line** - says only what to do or not do. No why, no symptom, no tool tag in parentheses (the section names the tool).
3. **Snippets** - only where one helps. Each snippet is its own file under the skill's `references/`, linked from its line by path; no labels, no line numbers. The repo's "relative links resolve" test keeps the links honest.
4. **Glossary** - every skill ends with `## Glossary`: one line per term the skill uses that is not plain English (coined, technical or domain), such as "phantom property".
5. **Procedure skills** (audit, build, init, plan, prototype, retro) - a bare `# name` title, the Input/Output line, then one `## Steps` section that is the `- [ ]` checklist the session copies and ticks; each stop condition sits under the step it stops. Mode sections (`## Under a /goal`, `## Fast-path fix`) and the resume file stay. Then `## Do`, `## Don't`, `## Glossary`.
6. **Output templates** - a fixed output a skill prints comes from a template file in its `references/`, as build's `references/plan-comment.md` already does.
7. **Skill template** - `templates/skill-template.md`, copied by `/outputty:init` to `~/.claude/skill-template.md` like `templates/README.md` → `~/.claude/readme-template.md`, and added to the Dogfood twins in `CLAUDE.md`. It shows the new shape for both kinds. Today's user-level file says «Group the traps by the problem a session meets» and asks for «how it shows, and the fix»; decisions 1 and 2 reverse both.
8. **Generic** - a domain skill names no project's code or data.
9. **Grade** production grade; **Gating** none; one PR.

#### Defaults shown to the user, not yet confirmed

The user saw these and did not object; confirm them in the ticket draft.

1. **A1** - templates for: each procedure skill's final report, plan's question format and decision tree, retro's three lines, tickets' list and goal line, init's per-file line.
2. **A2** - documentation's Diátaxis `references/glossary.md` stays; its SKILL.md Glossary holds the SKILL.md's own terms.
3. **A3** - the five `AskUserQuestion` batch rules become one wording, "four per call", in each skill that asks; the trial-fork paragraph stays in both build and prototype.
4. **A4** - tracker keeps its commands inline in Do lines; herdr and tickets take Steps plus Do/Don't; documentation's references stay as they are.
5. **A5** - a test that pins a step heading or a reworded phrase moves to the new wording; the behaviour it pins stays.

#### Fixes the rewrite must include

1. **F1** - `__tests__/skills.test.mjs:163` (R13) fails today: `skills/typescript-node/SKILL.md` never names `references/fast-types.ts`. Both files are uncommitted edits in the main checkout (with `.claude-plugin/marketplace.json` at 0.172.0); copy them onto the planning branch. Decision 3 replaces `fast-types.ts` with one file per snippet.
2. **F2** - the typescript-node lines and their examples disagree: `SKILL.md:26` `BuildResult<F, Tests, Marks>` against `fast-types.ts:94` `BuildResult<F>`, and lines 27 and 28 likewise. `fast-types.ts:95`'s `__state?` is a phantom property while `SKILL.md:35` forbids them. The rule becomes: type a fact the run time also holds from the member that holds it; keep phantom properties for facts only the type checker needs.
3. **F3** - one project's data in generic skills: laygo's `drain`/`Drained`, `Entry<Input, Stored, Origin>`, `lowercaseNames` in typescript-node; `data-engineering/SKILL.md:77` and `:82`; `frontend/SKILL.md:28-29`; `tickets/SKILL.md:28` (laygo's retired `m.query`).
4. **F4** - the undefined terms per skill (catalogue, Part 3, "Undefined terms") go into each skill's Glossary.

#### What the plan session still does

1. Draft the ticket per the `tracker` skill: Solution with one trap skill (typescript-node's ts-pattern section) and one procedure skill (prototype), before and after; Implementation criteria; Where; Sibling (`skills/build/references/plan-comment.md` for templates).
2. Show the draft and ask whether it is settled, A1-A5 included.
3. On the go: check the worktree sits on `origin/main`, copy the uncommitted typescript-node files and the version bump from the main checkout onto the planning branch, write `plans/<date>-skill-shape.md`, open the draft planning PR, file the ticket on `outputty/claude-plugin` and add it to board 4, add the roadmap's Next line. Then tell the user the main checkout's copies can be discarded.

#### Plan session, round 1 (2026-11-22)

- Worktree `worktree-plan-skill-shape` at `0fb8d7e`, behind `origin/main` `71cb324` with no commits of its own: fast-forward at go.
- `origin/main`'s marketplace version is 0.174.0; the main checkout's uncommitted 0.172.0 is stale - not copied; the build bumps above main's.
- `origin/main`'s `.claude/settings.json` denies `Read(./plans/**)`: a build cannot read the repo plan record, so the ticket carries the term list and the template list itself.
- R13 is at `__tests__/skills.test.mjs:160` on `origin/main`. The catalogue's typescript-node line cites are against the main checkout's uncommitted SKILL.md (30 lines added at :10); on main, `.otherwise()` is :13.
- Snippet run: `match(shape)` on `S extends Shape` fails tsc (TS2769, TS2339, TS2349, TS7031); `const concrete: Shape = shape; match(concrete)` passes (ts-pattern 5.9.2, TypeScript 7.0.2).
- Ticket draft: `skill-shape-ticket-draft.md` beside this file.
- Asked this round: settled (A1-A5 and the session's own choices), priority, documentation's shape, how the uncommitted typescript-node files reach the planning branch.

## Round 1 answers, word for word

1. Settled, and go: "Go: file it".
2. Priority: "priority:high".
3. documentation's shape: picked "Steps + Do/Don't", with the note: "Documentation doesn't really have steps. It's just general rules and guidelines for creating coherent documentation according to the framework. I'd say that it should be template-heavy with mostly dos and don'ts in the skill. An exception we could have to the steps would be to have a validation section with a checklist that validates whether a specific file/section follows the general guidelines"
4. The uncommitted typescript-node files: "Copy + link line".
5. The reading shown back for documentation (Do/Don't sections by topic, one template file per Diátaxis kind in `references/`, a closing `## Validate` checklist run against a file or section, no `## Steps`): "Yes, file it so". Then: "Documentation skill has a validation section that contains steps/checklist, no?" - yes: `## Validate` is its `- [ ]` checklist.

## Choices the plan session made

1. **C1** - no `SKILL.md` body holds a fenced block; it follows from decisions 3 and 6.
2. **C2** - the build type-checks each TypeScript snippet once in `tmp/`; no CI type-check, which would add typescript and each snippet's library as devDependencies.
3. **C3** - the shape is held by new tests in `__tests__/skills.test.mjs`.
4. The main checkout's 0.172.0 version bump was not copied: `origin/main` was already at 0.174.0.

## Spike: the ts-pattern snippet

Run with ts-pattern 5.9.2 and TypeScript 7.0.2, `tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler <file>`.

```ts
// before - fails: error TS2769, error TS2339, error TS2349, error TS7031
import { match } from "ts-pattern";

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

export function area<S extends Shape>(shape: S): number {
  return match(shape)
    .with({ kind: "circle" }, ({ radius }) => Math.PI * radius ** 2)
    .with({ kind: "square" }, ({ side }) => side ** 2)
    .exhaustive();
}
```

```ts
// after - no output, exit 0
import { match } from "ts-pattern";

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

export function area<S extends Shape>(shape: S): number {
  const concrete: Shape = shape;
  return match(concrete)
    .with({ kind: "circle" }, ({ radius }) => Math.PI * radius ** 2)
    .with({ kind: "square" }, ({ side }) => side ** 2)
    .exhaustive();
}
```

## Options dropped

1. The trap line `**<what goes wrong, or what to do>** (<tool>) - <how it shows, and the fix>`: a line carries what to do, never the why or the symptom.
2. Grouping by the problem a session meets: a section is named by its tool or topic.
3. One example file per skill under labels: one file per snippet.
4. Pointing at a snippet by line number: "Don't reference lines. Each snippet is a single file."
5. The `# name - tagline` title and the premise paragraph.
6. A `trial` skill and an `ask` skill: only the skill template was picked.
7. A stack: one PR.
8. documentation as a procedure skill with `## Steps`: it is rules and templates, with one `## Validate` checklist.

## Research: the "Types that check fast" lines, as first written

#### Types that check fast

##### Don't

- Don't pass an accumulated registry type into builder types that never read it.
- Don't type a callback's return as the full builder type.
- Don't make a builder method return a new builder type to record a fact.
- Don't export a generic class as the public type.
- Don't add a class type parameter only to validate a literal.
- Don't use the polymorphic `this` type in builder methods: `drain(): this & Drained`.
- Don't use anonymous object types that reference outer type parameters inside generic members.
- Don't compare each new entry against all previous entries at the type level.
- Don't look up a declaration-merged registry on every chained call.

##### Do

- Type a callback's return as the one state field you read: `(b) => BuildResult<F, Tests, Marks>`.
- Give builder types only the type parameters their members use: `Builder<Row, E>`.
- Keep accumulated state in one map of named entries: `Store<{ orders: Entry<Input, Stored, Origin> }, E>`.
- Export an interface as the public type, keep the class internal, and move members without type parameters to a non-generic base interface.
- Validate a constructor literal with a type parameter on the construct signature, not on the instance type.
- Validate each value where it is written, with a string literal type as the error message.
- Use a generic `this` parameter in builder methods: `drain<Self>(this: Self): Self & Drained`.
- Add variance annotations (`in`, `out`, `in out`) to hot generic types, and let `tsc` verify them.
- Name object types used inside generic members.
- Derive type facts from real members, such as `readonly lowercaseNames = true as const`, not phantom properties.
- Pass a generic helper's type argument explicitly: `rowsOf<Order>()`.
- Back every `tsc` refusal with a run-time check that gives the same message.
- Measure with `tsc --extendedDiagnostics --checkers 1`: the default checkers repeat work and sum their counts.

## Research: the shape catalogue

Paths are relative to `/Users/ringolds/Documents/Outputty/claude-plugin/`, except those that start with `~`. Each quote is exact, sits between guillemets, and is followed by its file and line; every quote was checked by script against that line. "Inferred" marks a judgement of mine; every other claim is read from the files. All 13 SKILL.md files, `plan-comment.md`, `fast-types.ts`, `cheatsheet.md`, `glossary.md` and `patterns.md` were read whole; the 12 documentation chapters were read in part (ch01, ch02, ch06) and otherwise by their headings and a search for tables, fences, blockquotes and bold-label lines. Body line counts use the test's own count (frontmatter excluded). The test run as it stands: 124 tests, 123 pass, 1 fails (typescript-node R13, see part 3).

Every skill gets the generic rubric checks: R1/R2/R17 frontmatter, R3 body under 500 lines, R4 a reference over 100 lines opens with `## Contents` (`.md` only), R5 references one level deep, links resolve, R13 every bundled script is named, R12 no backslash paths, no retired doc names, no `plans/` pointer outside plan and init, no folder named `*review*`. Only the content pins are listed per skill below.

#### Part 1 - Per skill

##### audit

- Purpose: «Audits a codebase, or the folders the user names, against every code rule in force» (skills/audit/SKILL.md:3)
- Kind: procedure, ending in a report format (inferred).
- Headings: `# audit - every rule, every file, no assumptions` · `1. Read the rules` · `2. Set the scope` · `3. List the facts` · `4. Read every file` · `5. Ask the questions` · `6. Report`
- Body: 66 lines. Frontmatter: name, description, argument-hint.
- Shapes:
  - Input/Output opener: «Input: the folders or files the user names. Output: one report in the reply with the findings, the questions and a refactor plan.» (skills/audit/SKILL.md:9)
  - Numbered bold principles, no lead-in: «1. **Assume nothing.** A case the rules do not settle» (skills/audit/SKILL.md:11)
  - Fenced checklist: «- [ ] 1. Read the rules» (skills/audit/SKILL.md:18)
  - Numbered H2 steps: «## 1. Read the rules» (skills/audit/SKILL.md:26)
  - Bold subject in a sentence: «- **Classes** is judged from each class's public surface.» (skills/audit/SKILL.md:54)
  - Record format: «its `file:line`, the rule's own words, and what the code does instead, in one line.» (skills/audit/SKILL.md:58)
  - Question batching: «Put every question to the user with `AskUserQuestion`, four per call» (skills/audit/SKILL.md:62)
  - Subagent brief spec: «Its brief gives the paths of the rule files, its files, the facts from step 3 and the shape of a finding and of a question» (skills/audit/SKILL.md:38)
  - Report under the output style's headings: «Reply under the style's headings:» (skills/audit/SKILL.md:66), «- **Assumptions** - none of the auditor's own» (skills/audit/SKILL.md:68)
- Pins (test "the code rules have one home, and the audit covers all of them"):
  - every code-rule heading in bold: «**Exploring**, **Structure**, **Classes**, **Fits in your head**, **Names**, **Docstrings and comments**, **Tests**» (skills/audit/SKILL.md:28)
  - «is a question, never a finding» (skills/audit/SKILL.md:11)
  - «The audit edits nothing and files nothing» (skills/audit/SKILL.md:9)
  - «the user decides how the plan is actioned» (skills/audit/SKILL.md:9)
  - «nothing that depends on it enters the plan» (skills/audit/SKILL.md:62)
  - «`~/.claude/rules/code.md`» (skills/audit/SKILL.md:28)
  - negative: never contains `at most seven paths`.

##### build

- Purpose: «Builds one ticket, or several in order, to one PR per ticket ready for review, docs last, in this session's worktree» (skills/build/SKILL.md:3)
- Kind: procedure, with mode sections and an escalation list (inferred).
- Headings: `# build - one ticket, one PR` · `1. Read and claim` · `2. Plan the layers` · `3. Build each layer` · `4. Review once` · `5. Docs layer` · `6. Finish` · `Code rules` · `Several tickets` · `Under a /goal` · `Stop conditions`
- Body: 110 lines. Frontmatter: name, description, argument-hint. Reference: `references/plan-comment.md` (31 lines, a template).
- Shapes:
  - Placeholder definition: «`<n>` is the ticket number from `$ARGUMENTS` or the active goal.» (skills/build/SKILL.md:9)
  - Premise paragraph: «A ticket lands as one PR: its planning PR, with every layer's commits pushed onto it.» (skills/build/SKILL.md:11)
  - Fenced checklist: «- [ ] 1. Read and claim» (skills/build/SKILL.md:16)
  - Numbered steps with nested bullets: « - Delete the docstring of each unit an edit changes before making the edit» (skills/build/SKILL.md:55)
  - Templates: «`<premise> - checked: <file:line or doc section>`» (skills/build/SKILL.md:31), «`<type>(<scope>): <title>, L<k> (#<n>)`» (skills/build/SKILL.md:56), «`high --fix Assumptions to verify against the diff: A1 - <premise>. A2 - <premise>.`» (skills/build/SKILL.md:65)
  - Reference template: «Post the plan as a ticket comment, in the shape of `references/plan-comment.md`.» (skills/build/SKILL.md:41); the file: «1. L1 - <what lands> - <cases it serves>» (skills/build/references/plan-comment.md:20)
  - Trial-fork paragraph (shared with prototype): «name the observable that would decide it and offer a trial» (skills/build/SKILL.md:43)
  - Skill cross-refs: «Every ticket, board and PR command is in the `tracker` skill.» (skills/build/SKILL.md:9), «1. Use the `documentation` skill.» (skills/build/SKILL.md:72), «give the goal line from the `tickets` skill to set instead» (skills/build/SKILL.md:104)
  - Step refs: «per step 1.4» (skills/build/SKILL.md:31), «per Stacked PRs» (skills/build/SKILL.md:48)
  - Mode sections: «## Under a /goal» (skills/build/SKILL.md:100), «## Several tickets» (skills/build/SKILL.md:92)
  - Stop list: «Ask with `AskUserQuestion`, naming the PR and the layers pushed so far:» (skills/build/SKILL.md:108), «- A fix fails twice after a real diagnosis. Give both diagnoses.» (skills/build/SKILL.md:110)
  - Owner trigger phrase: «on the user's "branch it"» (skills/build/SKILL.md:115)
- Pins:
  - «offer a trial. On the user's yes, run one trial fork per shape, one after the other» (skills/build/SKILL.md:43) (test "build and prototype try a judgement call only on the user's yes…"); negative: no `trial fork per <word> in parallel`
  - «no judgement call; try nothing else» (skills/build/SKILL.md:43)
  - «start each fork with `isolation: "worktree"`» (skills/build/SKILL.md:43)
  - «post it as a ticket comment, commit and push the work so far, park the ticket, and build the next unblocked ticket» (skills/build/SKILL.md:98)
  - ordering pin: «2. Call `advisor` on the finished diff» (skills/build/SKILL.md:79) must come before «3. Run every Implementation-criteria case» (skills/build/SKILL.md:80)
  - «format check, lint and typecheck commands» (skills/build/SKILL.md:57)
  - «from the prototype when the ticket has one» (skills/build/SKILL.md:48)
  - «every case passes and the `tracker` skill's stub list prints nothing» (skills/build/SKILL.md:80)
  - «Otherwise gate at construction: the orchestrator passes» (skills/build/SKILL.md:40)
  - «Delete the docstring of each unit an edit changes before making the edit» … «cut what the search does not find» (skills/build/SKILL.md:55)
  - «`~/.claude/rules/code.md`» (skills/build/SKILL.md:54)
  - negatives: no `<number> added lines`; no H2 named `Packages`, `Classes`, `Fits in your head`, `Names` or `Docstrings`.

##### data-engineering

- Purpose: «Lists the load, staging, concurrency and cross-engine traps a data pipeline hits, each with its fix» (skills/data-engineering/SKILL.md:3)
- Kind: trap list (a domain skill on the template).
- Headings: `# data-engineering` · `Loading and idempotent retry` · `Staging and transactions` · `MERGE and upsert` · `History and deletions` · `Partitioning and pruning` · `Hashing across engines` · `Partitioned aggregation` · `Spreadsheet extraction` · `Postgres limits` · `DuckDB behaviour`
- Body: 91 lines. Frontmatter: name, description.
- Shapes:
  - Template intro line, reworded: «The load, staging, concurrency and cross-engine traps a data pipeline hits, grouped by the problem, with the engine named where a line is about one.» (skills/data-engineering/SKILL.md:8)
  - Trap line, tool in parentheses: «- **`pg-copy-streams` with one push per row is a regression** (Postgres) - it is several times slower» (skills/data-engineering/SKILL.md:16)
  - Trap line, tool inside the label: «- **DuckDB TEMP table is connection-scoped** - it survives its own `COMMIT` on the same connection» (skills/data-engineering/SKILL.md:21)
  - Bold label that runs on with no dash: «- **dbt `on_schema_change: sync_all_columns` drops columns** missing from the new select» (skills/data-engineering/SKILL.md:31)
  - Whole line bold, no fix: «- **DOUBLE and REAL cast to text as `2.0` in DuckDB and `2` in Postgres.**» (skills/data-engineering/SKILL.md:55)
  - Section rule before the bullets: «Derive a portable hash input from JSON `->>` text, which agrees on Postgres and DuckDB, never from a typed column.» (skills/data-engineering/SKILL.md:50)
  - Wrong-answer code: «[3, 2].reduce(count, 0); // 2 (the number of partials); the right answer is 5» (skills/data-engineering/SKILL.md:65)
  - Fix code: «FROM t, unnest(t.items) WITH ORDINALITY AS u(item, ord);» (skills/data-engineering/SKILL.md:94)
  - Request example: «GET https://sheets.googleapis.com/v4/spreadsheets/<id>/values:batchGet?ranges=Companies&ranges=Stats» (skills/data-engineering/SKILL.md:77)
- Pins: none beyond the generic rubric.

##### documentation

- Purpose: «Writes or rewrites a README or project doc to outputty's code-forward standard, de-slopping one that reads AI-generated» (skills/documentation/SKILL.md:3)
- Kind: mix: a conventions list, a classification method, three procedures and an index of references (inferred).
- Headings: `# documentation - classify, then write what a reader can copy from` · `Conventions` · `Classify first` · `Write each kind to its form` · `Write or rewrite` · `De-slop an existing doc` · `Grow a docs set` · `References`
- Body: 82 lines. Frontmatter: name, description. References: `cheatsheet.md` 88, `glossary.md` 47, `patterns.md` 41, and 12 chapters of 52-66 lines each.
- Shapes:
  - External template pointer: «`~/.claude/readme-template.md` is the spine to draft against.» (skills/documentation/SKILL.md:8)
  - Plain rule bullets: «- Command fences drop the `$ ` prefix and keep output outside the fence.» (skills/documentation/SKILL.md:15)
  - Two-question classifier: «- Does it inform **action** (doing) or **cognition** (knowing)?» (skills/documentation/SKILL.md:26)
  - Formula bullets: «- action + acquisition = **tutorial** - answers "Can you teach me to…?"» (skills/documentation/SKILL.md:31)
  - Bold-label definitions: «- **Reference** - dry, neutral description of the machinery, consulted, not read.» (skills/documentation/SKILL.md:43)
  - Loop-back step: «If one fails, fix the example (or the claim it backs) and return to step 3; go to step 4 only when every one passes.» (skills/documentation/SKILL.md:52)
  - Cross-section step ref: «per Write or rewrite step 3» (skills/documentation/SKILL.md:61)
  - Reference index with attribution: «Diátaxis, by Daniele Procida (diataxis.fr, retrieved 2026-08-11» (skills/documentation/SKILL.md:70), «- `glossary.md` - every Diátaxis term, defined.» (skills/documentation/SKILL.md:73)
  - In the references: tables («| If you see… | You have… | Fix |» (skills/documentation/references/cheatsheet.md:43)), glossary entries («**Acquisition** - the "at study" pole of the acquisition/application dimension» (skills/documentation/references/glossary.md:3)), When to use / How / Trade-offs («**When to use**: titling any how-to guide. **How**:» (skills/documentation/references/patterns.md:25)), and a fixed chapter template (Core Idea, Frameworks Introduced, Key Concepts, Mental Models, Anti-patterns, Worked Example, Key Takeaways, Connects To; ch09 has no Worked Example, ch11 has no Anti-patterns).
- Pins: none beyond the generic rubric.

##### frontend

- Purpose: «Lists frontend traps and their fixes» (skills/frontend/SKILL.md:3)
- Kind: trap list (a domain skill on the template).
- Headings: `# frontend` · `Rapid input and URL sync` · `Hydration mismatches` · `Table state and facets` · `Virtualized rows and scroll containers` · `Copying and restyling component recipes` · `Bar charts` · `Astro`
- Body: 58 lines. Frontmatter: name, description.
- Shapes:
  - Template intro line: «The frontend traps a strong model still gets wrong, grouped by the problem, with the library named where a line is about one.» (skills/frontend/SKILL.md:8)
  - Trap line with tool: «- **External atoms win** (TanStack Table v9) - precedence is» (skills/frontend/SKILL.md:27)
  - Trap line without tool: «- **Facets ignore their own column's filter** - » (skills/frontend/SKILL.md:28)
  - Parenthetical that is not a tool: «- **`getRelativeLocaleUrl` adds a trailing slash** (`/charts/`) that `Astro.url.pathname` lacks» (skills/frontend/SKILL.md:61)
  - Fix code: «constructTable({ ...opts, features: tableFeatures({ coreReactivityFeature: storeReactivityBindings(), ...rest }) });» (skills/frontend/SKILL.md:33)
  - Exact error: «raises React #418» (skills/frontend/SKILL.md:21)
  - Symptom triggers in the description: «Use when a URL freezes during a drag, React #418 or a hydration mismatch appears» (skills/frontend/SKILL.md:3)
- Pins: none beyond the generic rubric.

##### herdr

- Purpose: «How a planning, prototype or build session is opened inside Herdr» (skills/herdr/SKILL.md:3)
- Kind: mix: a router for session handoff (case → label, model, worktree), a command procedure and a trap list (inferred).
- Headings: `# herdr - a new tab alongside this session` · `Open a tab and start the agent` · `The cases` · `Traps`
- Body: 33 lines. Frontmatter: name, description.
- Shapes:
  - Environment guard: «Outside Herdr (`test "${HERDR_ENV:-}" = 1` fails)» (skills/herdr/SKILL.md:12)
  - Numbered steps holding inline commands: «1. `herdr tab create --workspace "$HERDR_WORKSPACE_ID"» (skills/herdr/SKILL.md:16)
  - Case list as bold-label bullets (colon): «- **Build**: label `(build) <n> <slug>`, name `build<n>`» (skills/herdr/SKILL.md:25)
  - Plain imperative traps (no bold, no tool): «- Flatten the prompt to one line.» (skills/herdr/SKILL.md:36)
  - Nested trap: « - `herdr pane move <pane_id> --tab <tab_id>` relocates a stray running agent» (skills/herdr/SKILL.md:32)
  - Owner trigger phrase: «unless the user says "do it here"» (skills/herdr/SKILL.md:8)
- Pins:
  - «--worktree proto-<n or slug> --model haiku» (skills/herdr/SKILL.md:27) (test "herdr opens a prototype in its own worktree on Haiku")
  - «Create every worktree from the latest `main`» (skills/herdr/SKILL.md:10) (test "the lines one skill needs live in that skill")
  - negative: the word `review` appears nowhere.

##### init

- Purpose: «Scaffolds outputty into a repo - copies the rules, templates and settings» (skills/init/SKILL.md:3)
- Kind: procedure (install and upgrade).
- Headings: `# init - scaffold, then align the repo's CLAUDE.md` · `1. Copy the scaffold` · `2. Read the repo` · `3. Draft the CLAUDE.md` · `4. Finish` · `Upgrading`
- Body: 77 lines. Frontmatter: name, description, disable-model-invocation.
- Shapes:
  - Resume file: «Write progress to `~/.claude/projects/<project>/plans/init.md`; a restarted session reads it first.» (skills/init/SKILL.md:9)
  - Fenced checklist, also copied to a file: «Copy this checklist into your first reply and into `init.md`, and tick each item as it lands:» (skills/init/SKILL.md:15)
  - Print-line template: «Print one line per file: `<path>: created | unchanged | kept, differs | merged | removed`.» (skills/init/SKILL.md:26)
  - Numbered bold labels, period inside: «1. **What the plugin supplies.** Init copies neither» (skills/init/SKILL.md:28); colon inside: «2. **User level, created when absent, kept when present:**» (skills/init/SKILL.md:35)
  - Arrow mapping: «- `templates/README.md` → `~/.claude/readme-template.md`.» (skills/init/SKILL.md:37)
  - Parallel subagents: «Dispatch one `Explore` agent per source, in parallel» (skills/init/SKILL.md:44)
  - Sample of a finished section: « - Behaviour: the tests in `__tests__/`.» (skills/init/SKILL.md:56)
  - Step ref by heading name: «item 1 of **1. Copy the scaffold** and item 5 of **3. Draft the CLAUDE.md**» (skills/init/SKILL.md:82)
- Pins:
  - «under **This repo** in `CLAUDE.md`» (skills/init/SKILL.md:76); negative: no `under **Tracker**`
  - «In a monorepo the scaffold and the drafted `CLAUDE.md` go at the monorepo root (`git rev-parse --show-toplevel`), once, wherever init is run from» (skills/init/SKILL.md:13)
  - «Create `plans/` with a `.gitkeep`. Add the line `plans/` to a root `.ignore` file» (skills/init/SKILL.md:40)
  - «gate a feature at construction (build), create every worktree from the latest `main` (herdr), enforce a structural rule in the linter's config before prose (retro)» (skills/init/SKILL.md:29)
  - «Keep the user's own Tools line, and every other line of the user's own» (skills/init/SKILL.md:29)
  - «`~/.claude/output-styles/outputty.md`, and the `"outputStyle": "outputty"` key» (skills/init/SKILL.md:30)
  - «Each of `~/.claude/skills/{plan,prototype,tickets,build,audit,retro,tracker,herdr,documentation,data-engineering,frontend,typescript-node}/`: the plugin ships it as `/outputty:<name>`» (skills/init/SKILL.md:31)
  - negatives: no ``Merge `…context.md` `` or `CLAUDE.user.md`, no `` → `~/.claude/output-styles``, no `` Set `"outputStyle"``, no `` → `~/.claude/skills``. Exempt from the `plans/` pointer ban.

##### plan

- Purpose: «Plans one ticket with the user - asks until nothing answerable is left, lists where the fix could land, gets the user's pick, then files the ticket.» (skills/plan/SKILL.md:3)
- Kind: procedure (an interview), with session rules.
- Headings: `# plan - interview, pick, file` · `Scratch file` · `Start` · `Interview` · `Spike` · `Where the fix lands` · `Fast-path fix` · `Done`
- Body: 85 lines. Frontmatter: name, description, argument-hint.
- Shapes:
  - Input/Output opener: «Input: an idea, a ticket number labelled `needs-planning`, or a local `prototype/<name>` branch.» (skills/plan/SKILL.md:9)
  - Session rules: «These rules hold for the whole session:» (skills/plan/SKILL.md:13), «1. **Discuss until go.** Edit no repo file and file no ticket until the user says go.» (skills/plan/SKILL.md:15)
  - Resume file: «A restarted session reads it first.» (skills/plan/SKILL.md:20)
  - Per-argument branches: «2. `/outputty:plan <n>`: read the ticket and its comments per the `tracker` skill» (skills/plan/SKILL.md:25)
  - Decision tree with status marks: «`✓` settled, `→` asked this round, `○` waiting on the node above it» (skills/plan/SKILL.md:31), «│ ├─ → Q9 stream or buffer» (skills/plan/SKILL.md:40)
  - Question format: «**Q1** - **<title>**: <the question, one idea, alternatives if they exist>» (skills/plan/SKILL.md:49), «Recommend: <your answer, and why in one line>» (skills/plan/SKILL.md:50)
  - Premise labels: «grounded (cite the anchor), absent (say so at once), or unknown (say so, and offer a spike)» (skills/plan/SKILL.md:54)
  - Objection ranking: «rank each objection high, medium or low, citing a source opened this session» (skills/plan/SKILL.md:59)
  - Checklist by instruction only: «Copy them into your reply as a `- [ ]` checklist and tick each one as it lands:» (skills/plan/SKILL.md:84)
  - Owner trigger phrase: «On the user's "build it now", run **Done**» (skills/plan/SKILL.md:78)
- Pins:
  - «Edit no repo file and file no ticket until the user says go» (skills/plan/SKILL.md:15)
  - «Ask whether the build stacks» (skills/plan/SKILL.md:74)
  - «1. Read the place in hand» (skills/plan/SKILL.md:68)
  - «2. Read one level up» (skills/plan/SKILL.md:69)
  - «A spike runs only when the user asks for one» (skills/plan/SKILL.md:64)
  - «in the order the code rules' **Structure** gives» (skills/plan/SKILL.md:70)
  - Exempt from the `plans/` pointer ban.

##### prototype

- Purpose: «Prototypes an idea or a ticket cheaply - a test first for every requirement, then the fastest wiring of patterns the repo already has, with anything new stubbed» (skills/prototype/SKILL.md:3)
- Kind: procedure, with session rules.
- Headings: `# prototype - see it working, cheaply` · `1. Read` · `2. Branch` · `3. Tests first` · `4. Wire it` · `5. Show it` · `6. Hand off`
- Body: 49 lines. Frontmatter: name, description, argument-hint. No checklist.
- Shapes:
  - Input/Output opener: «Input: an idea, or a ticket number. Output: a local branch `prototype/<name>`» (skills/prototype/SKILL.md:9)
  - Purpose paragraph: «A prototype is the "I'll know when I see it" step» (skills/prototype/SKILL.md:11)
  - Session rules: «1. **Reuse only.** Copy and compose the nearest existing pattern.» (skills/prototype/SKILL.md:15)
  - Literal marker: «`TODO: stub - <what the build must design>`» (skills/prototype/SKILL.md:16)
  - Inline definition: «Find the **Sibling**: the existing code nearest to the requirement, which the wiring copies.» (skills/prototype/SKILL.md:27)
  - Commit template: «3. Commit: `test(prototype): <requirement>`.» (skills/prototype/SKILL.md:37)
  - Report spec: «3. Report the branch, the example's real output, each test with pass or fail, and each stub with its file and what the build must design.» (skills/prototype/SKILL.md:53)
  - Loop back: «go again from section 3» (skills/prototype/SKILL.md:54)
- Pins:
  - ordering pin: «## 3. Tests first» (skills/prototype/SKILL.md:33) before «## 4. Wire it» (skills/prototype/SKILL.md:39)
  - «`TODO: stub - » (skills/prototype/SKILL.md:16)
  - «never push, open a PR» (skills/prototype/SKILL.md:18)
  - «offer a trial. On the user's yes, run one trial fork per pattern, one after the other» (skills/prototype/SKILL.md:41); negative: no `in parallel`
  - «no judgement call; try nothing else» (skills/prototype/SKILL.md:41)
  - «start each fork with `isolation: "worktree"`» (skills/prototype/SKILL.md:41)

##### retro

- Purpose: «Turns a correction the user repeats into a new lint rule, the removal of a lint rule that conflicts with it, or a line in the repo's CLAUDE.md.» (skills/retro/SKILL.md:3)
- Kind: procedure, with a ranked first-match list that routes each correction (inferred).
- Headings: `# retro - turn a repeated correction into a check` · `1. Pick the sessions` · `2. State each correction at the user's altitude` · `3. Find the destination` · `4. Build the destination`
- Body: 56 lines. Frontmatter: name, description. Bundled script: `list-sessions.ts` (85 lines).
- Shapes:
  - Premise line: «A correction is written down only where something checks it: a lint rule, or a line in the repo's `CLAUDE.md`.» (skills/retro/SKILL.md:8)
  - Unfenced checklist with section numbers: «- [ ] Sessions listed and picked (1)» (skills/retro/SKILL.md:12)
  - Script and install lines: «`bun ${CLAUDE_SKILL_DIR}/list-sessions.ts`. Run the script, never read it.» (skills/retro/SKILL.md:22), «Requires jq (`brew install jq`).» (skills/retro/SKILL.md:24)
  - Command block: «jq -r 'select(.type=="user" or .type=="assistant")» (skills/retro/SKILL.md:27)
  - Fixed output lines: «write these three lines:» (skills/retro/SKILL.md:37)
  - Ranked first-match list: «Each correction goes to the first destination that can hold it:» (skills/retro/SKILL.md:47)
  - Three-way pick: «apply, reword, or drop» (skills/retro/SKILL.md:58)
- Pins (test "retro routes every correction to a lint rule or a CLAUDE.md line, and to nothing else"):
  - «1. **A new lint rule**» (skills/retro/SKILL.md:49)
  - «2. **A lint rule that conflicts with the correction**: delete it» (skills/retro/SKILL.md:50)
  - «3. **A line in the repo's `CLAUDE.md`**» (skills/retro/SKILL.md:51)
  - negatives: none of `lesson`, `.claude/rules`, `output-styles`, `settings.json`, `reproduces` (any case); no `~/.claude/skills`.

##### tickets

- Purpose: «Lists the open tickets with their blockers, priority, PR state and a before/after example each» (skills/tickets/SKILL.md:3)
- Kind: router with output templates: lists, prints the goal line, hands a pick to its session (inferred).
- Headings: `# tickets - what is open, and the goal line for one` · `The list` · `The goal line` · `Hand a pick to its session`
- Body: 47 lines. Frontmatter: name, description.
- Shapes:
  - Sort spec: «buildable tickets first (per the `tracker` skill), then `priority:high`, unlabelled and `priority:low`, newest first within a tier» (skills/tickets/SKILL.md:12)
  - Sample output: «4. #35 Archive old runs» (skills/tickets/SKILL.md:21)
  - Before/after in one fence: «// before» (skills/tickets/SKILL.md:27), «// after» (skills/tickets/SKILL.md:29)
  - Literal goal-line template: «/goal ticket #42 is built by following /outputty:build 42:» (skills/tickets/SKILL.md:38)
  - Substitution rule: «write `every layer is an open PR in one stack with the docs layer last` in place of» (skills/tickets/SKILL.md:41)
  - Routing: «the plan case with `/outputty:plan <n>` for a `needs-planning` pick» (skills/tickets/SKILL.md:51)
  - Owner trigger phrase: «On the user's "prototype"» (skills/tickets/SKILL.md:51)
- Pins (test "the default goal lines name no stack"): at least one line starts `/goal `, and none of them contains `stack`: «/goal ticket #42 is built by following /outputty:build 42:» (skills/tickets/SKILL.md:38), «/goal tickets #42, #43, #44 are built in that order» (skills/tickets/SKILL.md:46)

##### tracker

- Purpose: «Gives the exact tracker commands» (skills/tracker/SKILL.md:3)
- Kind: reference (commands to copy).
- Headings: `# tracker - the commands, verbatim` · `Contents` · `Writing tickets and PRs` · `Tickets` · `Board` · `PRs` · `Stacked PRs`
- Body: 281 lines (the largest). Frontmatter: name, description.
- Shapes:
  - Contents list: «- Board - Status moves on the project board» (skills/tracker/SKILL.md:12)
  - Requirement line: «Requires `gh` 2.94 or later, and `gh auth refresh -s project` for the Board commands.» (skills/tracker/SKILL.md:18)
  - Lead-in, then one command per fence: «Read one, body and labels, with its comments:» (skills/tracker/SKILL.md:34), «gh issue view <n> --json title,body,labels,comments» (skills/tracker/SKILL.md:37)
  - Inline commands in label bullets: «- Claim: `gh issue edit <n> --add-assignee @me`.» (skills/tracker/SKILL.md:61)
  - Trap note after a command: «`--limit` truncates silently» (skills/tracker/SKILL.md:97)
  - Inline definitions: «Buildable: `ready`, no assignee, every blocker closed.» (skills/tracker/SKILL.md:81), «the draft that `/outputty:plan` opens with the plan record» (skills/tracker/SKILL.md:119)
  - Template pointer: «A ticket body follows `.github/ISSUE_TEMPLATE/task.md`» (skills/tracker/SKILL.md:22)
- Pins (test "plan sets the stack label on the user's yes, and the tracker creates it"; test "build continues the prototype branch…"):
  - «gh label create stack --color 5319e7 --force» (skills/tracker/SKILL.md:77)
  - «gh issue create --title "<title>" --body-file tmp/issue.md --label ready,stack» (skills/tracker/SKILL.md:49)
  - «gh issue edit <n> --add-label stack» (skills/tracker/SKILL.md:79)
  - «git diff origin/main...HEAD | grep '^+.*TODO: stub'» (skills/tracker/SKILL.md:208)

##### typescript-node

- Purpose: «TypeScript and Node tooling traps - types that check fast» (skills/typescript-node/SKILL.md:3)
- Kind: mix: a Do/Don't rule list, then a trap list on the template.
- Headings: `# typescript-node` · `Types that check fast` (`### Don't`, `### Do`) · `Exhaustive matching` · `Lint-enforced boundaries` · `Building and publishing a package` · `Bun versus Node` · `Serving and streaming HTTP on Node` · `Multi-process with node:cluster` · `Schema libraries and Standard Schema`
- Body: 105 lines. Frontmatter: name, description. Reference: `references/fast-types.ts` (219 lines), which the SKILL.md never names.
- Shapes:
  - Template intro line: «The TypeScript and Node traps a strong model still gets wrong, grouped by the problem, with the tool named where a line is about one.» (skills/typescript-node/SKILL.md:8)
  - Don't list (the only H3s in any SKILL.md): «### Don't» (skills/typescript-node/SKILL.md:12), «- Don't export a generic class as the public type.» (skills/typescript-node/SKILL.md:17)
  - Do list: «- Use a generic `this` parameter in builder methods: `drain<Self>(this: Self): Self & Drained`.» (skills/typescript-node/SKILL.md:32)
  - Trap line with tool: «- **`P.symbol` is the wildcard** (ts-pattern) - it matches any symbol.» (skills/typescript-node/SKILL.md:44)
  - Exact error: «`TS2349 ... 'NonExhaustiveError<unknown>' has no call signatures`» (skills/typescript-node/SKILL.md:42)
  - Indented fence inside a bullet: « { "group": ["node:_", "node:_/**"] }» (skills/typescript-node/SKILL.md:53)
  - Labelled example file: «// dont-registry-in-builder» (skills/typescript-node/references/fast-types.ts:18), header «// Typecheck: tsc --noEmit --strict --target es2022 --module esnext fast-types.ts» (skills/typescript-node/references/fast-types.ts:2)
- Pins: none beyond the generic rubric. It fails R13 today (part 3).

#### Part 2 - Shape catalogue

1. **Tagline title** - an H1 of the form `name - tagline`. «# build - one ticket, one PR» (skills/build/SKILL.md:7). Used by audit, build, documentation, herdr, init, plan, prototype, retro, tickets, tracker. The bare `# name` form (template) is used by data-engineering, frontend, typescript-node.
2. **Input/Output opener** - one paragraph naming what the skill takes and gives. «Input: an idea, or a ticket number. Output: a local branch `prototype/<name>`» (skills/prototype/SKILL.md:9). Used by audit, plan, prototype; init gives Output only.
3. **Trap-list intro line** - the template's one-sentence frame. «The frontend traps a strong model still gets wrong, grouped by the problem, with the library named where a line is about one.» (skills/frontend/SKILL.md:8). Used by data-engineering (reworded), frontend, typescript-node.
4. **Premise paragraph** - one principle sentence before the steps. «A correction is written down only where something checks it: a lint rule, or a line in the repo's `CLAUDE.md`.» (skills/retro/SKILL.md:8). Used by build, herdr, init, prototype, retro.
5. **Progress checklist** - `- [ ]` items the session copies into its reply. «- [ ] 2. Plan the layers» (skills/build/SKILL.md:17). Fenced and numbered in audit, build, init; unfenced in retro; given only as an instruction in plan.
6. **Numbered step sections** - H2 headings `## N. Verb`. «## 3. Tests first» (skills/prototype/SKILL.md:33). Used by audit, build, init, prototype, retro.
7. **Numbered procedure steps** - ordered `1.` items. «1. Read the ticket: body, labels, comments.» (skills/build/SKILL.md:26). Used by audit, build, documentation, herdr, init, plan, prototype, retro.
8. **Nested sub-bullets** - detail under a numbered step. « - Expand only the branches that last round and this round touched.» (skills/plan/SKILL.md:33). Used by build, herdr, init, plan.
9. **Session rules** - numbered bold-label rules that hold for the whole run. «These rules hold for the whole session:» (skills/plan/SKILL.md:13). Used by plan, prototype; audit has the same list without the lead-in.
10. **Bold-label bullet** - a bold term, then a separator, then the body. Separators seen: `-` «- **Tutorial** - a lesson.» (skills/documentation/SKILL.md:41); `:` «1. **A new lint rule**: a rule in the linter the repo already runs, plus a probe test that reports a bad fixture and allows a good one.» (skills/retro/SKILL.md:49); a period inside the bold «1. **Discuss until go.** Edit no repo file and file no ticket until the user says go.» (skills/plan/SKILL.md:15). Used by audit, data-engineering, documentation, frontend, herdr, init, plan, prototype, retro, typescript-node.
11. **Trap line** - `**what** (tool) - how it shows, and the fix`. «- **`.otherwise()` compiles everywhere and checks nothing** (ts-pattern) - a case added later falls into it silently.» (skills/typescript-node/SKILL.md:43). Template: «- **<what goes wrong, or what to do>** (<tool>) - <how it shows, and the fix>.» (~/.claude/skill-template.md:24). Used by data-engineering, frontend, typescript-node.
12. **Plain imperative trap** - an unbolded do-this line with no tool or symptom. «- Double-quote the prompt argument and escape its backticks, `$` and inner double quotes.» (skills/herdr/SKILL.md:35). Used by herdr.
13. **Do/Don't lists** - two H3 lists of imperatives. «- Don't look up a declaration-merged registry on every chained call.» (skills/typescript-node/SKILL.md:22). Used by typescript-node only.
14. **Classifier formula** - questions whose answers name a kind. «- action + application = **how-to guide** - answers "How do I…?"» (skills/documentation/SKILL.md:32). Used by documentation (also as a table in its references).
15. **Decision tree picture** - an ASCII tree with status marks. «├─ ✓ Q1 output format» (skills/plan/SKILL.md:38). Used by plan only. No skill draws a flowchart or gantt chart; the output style defines those.
16. **Coded question with recommendation** - `**Q1** - **title**: question` then `Recommend:`. «Recommend: <your answer, and why in one line>» (skills/plan/SKILL.md:50). Used by plan only.
17. **AskUserQuestion directive** - when and how many questions per call. «four per call, calls back to back» (skills/plan/SKILL.md:46). Used by audit, build, plan, prototype, retro.
18. **Premise line** - a premise with how it was checked. «`<premise> - checked: <file:line or doc section>`» (skills/build/SKILL.md:31). Used by build, plan (as grounded/absent/unknown), and the plan-comment template.
19. **Command block** - a fenced command to copy, one per fence. «gh pr ready <planning-pr#>» (skills/tracker/SKILL.md:156). Used by tracker, retro.
20. **Inline command** - a command in backticks inside a step or bullet. «- Release: `gh issue edit <n> --remove-assignee @me`.» (skills/tracker/SKILL.md:62). Used by herdr, init, retro, tracker, and the three trap skills.
21. **Requirement/install line** - the tool, version and install command a skill needs. «Requires `gh` 2.94 or later, and `gh auth refresh -s project` for the Board commands.» (skills/tracker/SKILL.md:18). Used by retro, tracker.
22. **Bundled script call** - a script named with its exact command. «`bun ${CLAUDE_SKILL_DIR}/list-sessions.ts`. Run the script, never read it.» (skills/retro/SKILL.md:22). Used by retro.
23. **Placeholder template** - a literal string with `<slot>` fields. «3. Commit: `test(prototype): <requirement>`.» (skills/prototype/SKILL.md:37). Used by build, herdr, init, plan, prototype, retro, tickets, tracker.
24. **Document template in a reference** - a whole comment or body to fill. «The build posts this as a ticket comment at step 2.6, in this shape and nothing else.» (skills/build/references/plan-comment.md:3). Used by build only; ticket and PR templates live outside the skills (`templates/`).
25. **Sample output** - what the printed result looks like. «1. #52 Retry on 429» (skills/tickets/SKILL.md:15). Used by tickets, init (a finished section), plan (the tree).
26. **Before/after in one fence** - both states, each opened by a comment. «// before» (skills/tickets/SKILL.md:27). Used by tickets; prescribed by «- A before/after comparison is one fence holding both sides, each opened by a comment.» (skills/documentation/SKILL.md:14); required without a shape by build and audit.
27. **Wrong-answer example** - code that shows the wrong result and names the right one. «[3, 2].reduce(count, 0); // 2 (the number of partials); the right answer is 5» (skills/data-engineering/SKILL.md:65). Used by data-engineering.
28. **Fix snippet** - a short fence after a trap line. «FROM t, unnest(t.items) WITH ORDINALITY AS u(item, ord);» (skills/data-engineering/SKILL.md:94). Used by data-engineering, frontend, typescript-node.
29. **Exact error string** - the error as printed. «`ERR_MODULE_NOT_FOUND`» (skills/typescript-node/SKILL.md:101). Used by frontend, typescript-node.
30. **Table** - a markdown table. «| If you see… | You have… | Fix |» (skills/documentation/references/cheatsheet.md:43). Used only in documentation's references; no SKILL.md has a table.
31. **Glossary or inline definition** - a term and its meaning. File: «**Acquisition** - the "at study" pole of the acquisition/application dimension» (skills/documentation/references/glossary.md:3). Inline: «Buildable: `ready`, no assignee, every blocker closed.» (skills/tracker/SKILL.md:81), «Find the **Sibling**: the existing code nearest to the requirement, which the wiring copies.» (skills/prototype/SKILL.md:27). Glossary file: documentation only; inline: build, plan, prototype, tracker.
32. **When to use / How / Trade-offs** - a pattern card. «**When to use**: titling any how-to guide. **How**:» (skills/documentation/references/patterns.md:25). Used only in documentation's references. In skills, "when to use" lives only in the description's trigger clause; no skill has a "when not to use".
33. **Trigger phrases in the description** - quoted user words that should load the skill. «Use on "what's next", "list tickets", "which ticket".» (skills/tickets/SKILL.md:3). Used by audit, documentation, plan, retro, tickets; symptom triggers in frontend, typescript-node.
34. **Skill cross-reference** - a step handed to another skill. «Create the tracker's labels, per the `tracker` skill.» (skills/init/SKILL.md:75). build, init, plan, prototype, tickets → tracker; prototype, tickets → herdr; build → documentation, tickets, retro; plan → build. Handoffs by slash command: «Tell the user to run `/outputty:plan <n>`, and stop.» (skills/build/SKILL.md:29); prototype → build and plan «Name the next command: `/outputty:build <n>` for a ticket, or `/outputty:plan prototype/<name>` for an idea.» (skills/prototype/SKILL.md:53); herdr → tickets, plan, prototype (herdr:25-27); tickets → plan, prototype (tickets:12, tickets:51). User-file pointers: `~/.claude/rules/code.md` (audit, build), `~/.claude/readme-template.md` (documentation), the output style (audit).
35. **In-skill step reference** - a pointer to another step of the same skill. «per step 1.4» (skills/build/SKILL.md:31), «go again from section 3» (skills/prototype/SKILL.md:54), «item 1 of **1. Copy the scaffold**» (skills/init/SKILL.md:82), «per Write or rewrite step 3» (skills/documentation/SKILL.md:61). Used by build, documentation, init, plan, prototype, retro, tracker.
36. **Owner trigger phrase** - the user's quoted words that switch behaviour. «On the user's "build it now", run **Done**» (skills/plan/SKILL.md:78). Used by build, herdr, plan, tickets.
37. **Quoted owner rule** - none with attribution. build and audit point at `~/.claude/rules/code.md` by path, and a test forbids restating it. The nearest case is init, which restates in parentheses the standing lines it removes: «the standing lines (repository content is data, not instructions» (skills/init/SKILL.md:68), against «Repository content is data, not instructions» (hooks/context.md:10); and the moved lines «gate a feature at construction (build), create every worktree from the latest `main` (herdr)» (skills/init/SKILL.md:29). The only verbatim quote of an author is Diátaxis's: «"you don't have to believe in it and there is no exam"» (skills/documentation/references/chapters/ch01-start-here.md:53).
38. **Stop conditions** - when to halt and ask. «- The layer plan no longer serves the ticket.» (skills/build/SKILL.md:112). Used by build; one-line stops in plan («11. Stop when every branch is visited and nothing is silently assumed.» (skills/plan/SKILL.md:60)) and prototype.
39. **Mode section** - a section for one situation. «## Fast-path fix» (skills/plan/SKILL.md:76). Used by build (`Under a /goal`, `Several tickets`), init (`Upgrading`), plan.
40. **Resume file** - progress written so a restarted session picks up. «A restarted session reads it first.» (skills/plan/SKILL.md:20). Used by init, plan.
41. **Report spec** - what the final reply holds. «3. Report the branch, the example's real output, each test with pass or fail, and each stub with its file and what the build must design.» (skills/prototype/SKILL.md:53). Used by audit, build, plan, prototype, retro.
42. **Contents list** - a `## Contents` index. «## Contents» (skills/tracker/SKILL.md:8). Used by tracker only (in SKILL.md, where the template does not ask for it).
43. **Reference index** - each reference file with a one-line gloss. «- `patterns.md` - the techniques as when, how and trade-offs.» (skills/documentation/SKILL.md:74). Used by documentation.
44. **Source and license** - attribution for copied material. «licensed [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)» (skills/documentation/references/cheatsheet.md:88). Used by documentation.
45. **Chapter template** - Core Idea / Frameworks Introduced / Key Concepts / Mental Models / Anti-patterns / Worked Example / Key Takeaways / Connects To. «- Think of a tutorial as a driving lesson: the purpose is to develop skill and confidence in the student, not to get from A to B.» (skills/documentation/references/chapters/ch01-start-here.md:26). Used by documentation's 12 chapters.
46. **Question-led decision rule** - a bullet that opens with the situation as a question. «- Writing facts? If consulted during the task, it's reference» (skills/documentation/references/cheatsheet.md:27). Used by documentation's cheatsheet.
47. **Labelled example file** - one code example per rule, under a label comment. «// do-this-parameter» (skills/typescript-node/references/fast-types.ts:177). Used by typescript-node.
48. **Subagent instruction** - when to fan out and what the agent returns. «give each to its own subagent, which returns the user's corrections quoted verbatim» (skills/retro/SKILL.md:24). Used by audit, build and prototype (trial forks), init, plan, retro.
49. **Environment guard** - check where the session runs before acting. «Outside Herdr (`test "${HERDR_ENV:-}" = 1` fails)» (skills/herdr/SKILL.md:12). Used by herdr.
50. **Ranked first-match list** - try options in order and take the first that fits. «Each correction goes to the first destination that can hold it:» (skills/retro/SKILL.md:47). Used by retro, plan («in the order the code rules' **Structure** gives» (skills/plan/SKILL.md:70)), tickets (sort tiers).
51. **Pinned literal** - a phrase a test regex holds verbatim. «Edit no repo file and file no ticket until the user says go» (skills/plan/SKILL.md:15). Pinned in audit, build, herdr, init, plan, prototype, retro, tickets, tracker; none in data-engineering, documentation, frontend, typescript-node.

#### Part 3 - Inconsistencies

##### Same content, different shapes

1. **Checklist.** audit, build and init fence a numbered list; retro writes it unfenced with `(n)` suffixes («- [ ] Sessions listed and picked (1)» (skills/retro/SKILL.md:12)) and one item with no number («- [ ] Picks applied and committed» (skills/retro/SKILL.md:18)); plan only instructs («Copy them into your reply as a `- [ ]` checklist» (skills/plan/SKILL.md:84)); prototype has numbered sections and no checklist. The lead-in has three wordings: «Copy this checklist into your first reply and tick each item as it lands:» (skills/build/SKILL.md:13), «Copy this checklist into the reply and tick each item:» (skills/retro/SKILL.md:10), «Copy this checklist into your first reply and into `init.md`, and tick each item as it lands:» (skills/init/SKILL.md:15).
2. **Session rules.** plan and prototype open with «These rules hold for the whole session:» (skills/prototype/SKILL.md:13); audit has the same kind of numbered bold principles with no lead-in (skills/audit/SKILL.md:11).
3. **Bold-label separator.** `-` (documentation:41), `:` (herdr:25, retro:49), a period inside the bold (plan:15, prototype:15, init:28), a colon inside the bold «2. **User level, created when absent, kept when present:**» (skills/init/SKILL.md:35), and a bold subject in a running sentence (audit:54).
4. **Traps in five shapes.** Bold trap lines (data-engineering, frontend, typescript-node); plain imperatives under `## Traps` (herdr); Do/Don't (typescript-node); a symptom/diagnosis/fix table «| If you see… | You have… | Fix |» (skills/documentation/references/cheatsheet.md:43); bold-label `Anti-patterns` with a colon «- **Offering options and alternatives**: different flags, different approaches» (skills/documentation/references/chapters/ch02-tutorials.md:32).
5. **Tool tag on a trap line.** In parentheses after the label (data-engineering:16); inside the label (data-engineering:21); at the end of the label sentence «- **`no-restricted-syntax` does not ship in oxlint**» (skills/typescript-node/SKILL.md:58); absent (frontend:28); a parenthetical that is not a tool «(`/charts/`)» (skills/frontend/SKILL.md:61), «(AJV-style)» (skills/typescript-node/SKILL.md:109).
6. **Trap line ending.** Dash then fix (most); the bold runs into the sentence with no dash, as in data-engineering:31 and «- **A call-site `ml-auto` child in `CommandItem` shares free space** with the recipe's own `ml-auto` check» (skills/frontend/SKILL.md:47); a whole bold line with no fix (data-engineering:55).
7. **Grouping.** The template says «Group the traps by the problem a session meets» (~/.claude/skill-template.md:10). Several sections are named by tool instead (inferred): «## Postgres limits» (skills/data-engineering/SKILL.md:84), «## DuckDB behaviour» (skills/data-engineering/SKILL.md:88), «## Astro» (skills/frontend/SKILL.md:57), «## Bun versus Node» (skills/typescript-node/SKILL.md:69), «## Multi-process with node:cluster» (skills/typescript-node/SKILL.md:92), «## Schema libraries and Standard Schema» (skills/typescript-node/SKILL.md:103).
8. **Commands in tracker.** Most commands sit one per fence, even two that run in sequence: «git fetch origin <planning-branch>» (skills/tracker/SKILL.md:136), then «git switch -c feature/<slug>-<ticket#> origin/<planning-branch>» (skills/tracker/SKILL.md:140). Others sit inline in bullets (tracker:54-79). One merge is fenced («gh pr merge <pr#> --merge» (skills/tracker/SKILL.md:162)); the stack merge is inline in prose («Merge on the user's go-ahead: `gh stack merge <top-pr#> --yes`» (skills/tracker/SKILL.md:285)).
9. **Step sections.** Numbered in audit, build (1-6, then unnumbered extras), init, prototype, retro; unnumbered in plan and documentation, which are then referenced by name («run **Done**» (skills/plan/SKILL.md:78)).
10. **In-skill references, five styles.** «per step 1.4» (skills/build/SKILL.md:31); «return to section 2» (skills/retro/SKILL.md:58); «item 1 of **1. Copy the scaffold**» (skills/init/SKILL.md:82); «per Write or rewrite step 3» (skills/documentation/SKILL.md:61); «per Stacked PRs» (skills/build/SKILL.md:48).
11. **Before/after.** tickets puts both in one fence (tickets:27-30), as documentation prescribes (documentation:14). fast-types.ts puts every Don't in one half of the file and every Do in the other, so a pair is never side by side («// ---------- Don't ----------» (skills/typescript-node/references/fast-types.ts:16), «// ---------- Do ----------» (skills/typescript-node/references/fast-types.ts:88)). audit and build ask for a before/after with no shape.
12. **Definitions.** Inline with a colon (tracker:81), a bold term with a colon (prototype:27), an "is" sentence (build:9), a glossary file (documentation only). Most workflow terms are defined in `templates/ISSUE_TEMPLATE/task.md` or the output style, not in the skill that uses them (see Undefined terms).
13. **Questions to the user, five forms.** Coded with Recommend (plan:49-50); readings as options «offering its readings as the options» (skills/audit/SKILL.md:62); best guess first «your best guess as the first option» (skills/prototype/SKILL.md:26); fixed choices «apply, reword, or drop» (skills/retro/SKILL.md:58); «one round of questions with recommendations» (skills/init/SKILL.md:70). Batch sizes: «four per call» (skills/audit/SKILL.md:62) and (skills/plan/SKILL.md:46), «one `AskUserQuestion` per destination» (skills/retro/SKILL.md:58), «a single `AskUserQuestion`» (skills/prototype/SKILL.md:26), unstated in build.
14. **Description openers.** A third-person verb (Audits, Builds, Lists, Writes, Scaffolds, Plans, Prototypes, Turns, Gives) against a noun phrase («How a planning, prototype or build session is opened inside Herdr» (skills/herdr/SKILL.md:3), «TypeScript and Node tooling traps - types that check fast» (skills/typescript-node/SKILL.md:3)). Trigger clauses: `Use when` (data-engineering, frontend, typescript-node), `Use on` (documentation, tickets), `Use as` (audit, build, plan, prototype), `Use whenever` (herdr, tracker), «Runs when the user says "retro"» (skills/retro/SKILL.md:3), and none in init («Run once; run again after an upgrade to see what drifted.» (skills/init/SKILL.md:3)).
15. **Duplicated paragraph.** The trial-fork paragraph is near-verbatim in build:43 ("shape") and prototype:41 ("pattern"); tests pin both copies.
16. **Report formats.** audit replies under the output style's headings (audit:66); build, plan and prototype list report items in prose; retro fixes three lines per correction.

##### Undefined terms, per skill

Each term is undefined in the skill that uses it. "Elsewhere" names the plugin file that does define it; "nowhere" means a search (`rg`) of `skills/`, `templates/`, `hooks/`, `output-styles/`, `README.md` and `CLAUDE.md` found the term only in use, never defined. Judging use from definition is inferred.

- **audit:** "standing lines" (elsewhere: README; the lines are `hooks/context.md`); "the style's headings" and **Next** (elsewhere: `output-styles/outputty.md:191`); "probe" on a known case (nowhere; README, the plugin `CLAUDE.md` and `templates/rules/typescript.md` use it); "reader agent" (nowhere; audit only).
- **build:** "layer" (nowhere; README, `task.md` and tracker use it, e.g. «Make each layer leave the program working» (skills/build/SKILL.md:39)); "seam" (nowhere; `task.md:19` uses it); **Sibling**, **Gating**, **Grade**, **Where**, **Planning PR** (elsewhere: `templates/ISSUE_TEMPLATE/task.md:55-59`); "spike" (elsewhere: `hooks/context.md:19`); "advisor" (nowhere; README:53 names only its model); "build-story `Artifact`" (README describes it); "observable" (nowhere); "park" (output style:155); "stop-hook turns" (nowhere); "not-built-yet doc" (nowhere); `L<k>` (implied by the plan-comment template). "stack" is defined in the skill itself (build:11).
- **data-engineering** (domain terms, nowhere): "SCD2" («a one-pass SCD2 close-and-insert needs Postgres 17» (skills/data-engineering/SKILL.md:30)), "2PC", "zonemaps", "fold", "combine", "partials", "seed", "delete-insert", "ghost row", "quarantine sink", "COPY JOB", "WRITE_TRUNCATE", "Hive path".
- **documentation:** "spine" (README:74 names it but does not define it); "code-forward standard" (nowhere); "de-slop", "mannered filler" (glossed by example at documentation:58); the Diátaxis terms are defined in `references/glossary.md`.
- **frontend** (domain terms, nowhere): "atoms" / "external atom", "facets", "island", "recipe", "scrollport", "Content Layer", "React #418".
- **herdr:** "Herdr" itself (elsewhere: «[Herdr](https://herdr.dev), the terminal workspace manager for coding agents» (README.md:3)); "workspace", "pane" (nowhere; README:64 uses them); "pick" and "needs-planning handoff" (nowhere); `/goal` (a Claude Code feature).
- **init:** "standing lines" (README); "scaffold" (nowhere; README:103 uses it); "tracker ids" (nowhere; README:73 uses it); "drifted" in the description (nowhere).
- **plan:** "spike" (the skill says only when one runs; elsewhere: `hooks/context.md:19`); "seam" and "round" (nowhere; the output style uses "round" at :68); "go" (the user's word; not searched, too common); "Fast-path fix" (elsewhere: the plugin repo's own `CLAUDE.md:19`, which does not ship); "Attempted" (template); "planning PR" (tracker:119); "stack" (build:11, tracker:227).
- **prototype:** "seam", "observable", "trial fork" (nowhere; build and plan use them); "build-story artifact" (README:34 describes it); "advisor" (nowhere; README:53 names only its model). "Sibling" and "stub" are defined in the skill.
- **retro:** "altitude" in «## 2. State each correction at the user's altitude» (skills/retro/SKILL.md:35) (nowhere); "check" (the plugin repo's own `CLAUDE.md:20`, which does not ship). "probe test" is glossed at retro:49.
- **tickets:** "buildable" (tracker:81); "tier" (shown by the sort spec); "pick", "goal line", "layer", "stack" (in other skills).
- **tracker:** "layer" (nowhere); "stub" (only as the grep marker); "prototype branch" (prototype). "Planning PR" and "stack" are defined in the skill.
- **typescript-node:** "phantom properties" in «not phantom properties» (skills/typescript-node/SKILL.md:35) (nowhere; see Template breaks 3); "accumulated registry type", "builder", "state field", "record a fact", "construct signature", «hot generic types» (skills/typescript-node/SKILL.md:33), "checkers" in `--checkers 1` (all nowhere); "declaration-merged registry" (glossed only in fast-types.ts:77).
- **WAP:** in no file under `skills/` (skills, references, scripts), `templates/`, `hooks/`, `output-styles/`, `README.md` or `CLAUDE.md`.

##### Template breaks

1. **Failing test, typescript-node R13.** The SKILL.md never names `references/fast-types.ts`, so «does not name these scripts» (**tests**/skills.test.mjs:163) fires for `skills/typescript-node/references/fast-types.ts`. Template: «A longer explanation goes under references/, named here directly» (~~/.claude/skill-template.md:14) and «A bundled script is named here with its exact command and the install line for every tool it needs.» (~~/.claude/skill-template.md:15). The typecheck command lives only in the file's header (fast-types.ts:2), with no install line for `tsc`.
2. **Reference over 100 lines without `## Contents`.** fast-types.ts is 219 lines with no contents list. R4 checks only `.md` files, so the test passes; applying the template rule to a `.ts` file is inferred.
3. **Skill and example disagree.** The file claims «// One example per line of SKILL.md's "Types that check fast", each under its label.» (skills/typescript-node/references/fast-types.ts:1), but the SKILL.md lines carry no labels; they pair up only by order (9 Don't, 13 Do, matching 9 `dont-*` and 13 `do-*` labels). The signatures differ: «`(b) => BuildResult<F, Tests, Marks>`» (skills/typescript-node/SKILL.md:26) against «interface BuildResult<F> {» (skills/typescript-node/references/fast-types.ts:94); «`Builder<Row, E>`» (skills/typescript-node/SKILL.md:27) against «export interface LeanBuilder<Row, E extends Engine> {» (skills/typescript-node/references/fast-types.ts:106); «`Store<{ orders: Entry<Input, Stored, Origin> }, E>`» (skills/typescript-node/SKILL.md:28) against «export type Shop = MapStore<{ orders: Entry<Order, Order & { readonly loadId: string }, "flow"> }, Engine>;» (skills/typescript-node/references/fast-types.ts:121). And the Do example for the callback return carries an optional type-only member, « readonly __state?: BuilderState<F>;» (skills/typescript-node/references/fast-types.ts:95), which looks like the phantom property the skill forbids in «not phantom properties» (skills/typescript-node/SKILL.md:35) (inferred).
4. **Do/Don't lines break the line shape.** They have no bold, no tool and no symptom, against «- **<what goes wrong, or what to do>** (<tool>) - <how it shows, and the fix>.» (~~/.claude/skill-template.md:24). A line such as «- Don't look up a declaration-merged registry on every chained call.» (skills/typescript-node/SKILL.md:22) cannot be acted on «without opening anything else» (~~/.claude/skill-template.md:9) (inferred). No TypeScript version is named, though the template asks for «the version it holds for» (~/.claude/skill-template.md:11); `--checkers` is a TypeScript 7 flag (inferred).
5. **Repo-specific content in domain skills** (against «Generic to the domain: no reference to this repo's code or a current ticket.» (~/.claude/skill-template.md:16)), all inferred:
   - typescript-node and fast-types.ts use laygo's shapes: `drain` / `Drained`, `Entry<Input, Stored, Origin>`, `lowercaseNames`, and «// dont-merged-registry-per-call (MergedMembers is filled by each engine module's `declare module`)» (skills/typescript-node/references/fast-types.ts:77).
   - data-engineering and frontend carry one project's data: «ranges=Companies&ranges=Stats» (skills/data-engineering/SKILL.md:77), «one tab can carry `"Brand Name "`» (skills/data-engineering/SKILL.md:82), «so picking one sector leaves sector counts unchanged» (skills/frontend/SKILL.md:28), «the key is `["DeepTech"]`» (skills/frontend/SKILL.md:29).
   - Not a domain skill, but the shipped tickets skill uses laygo code, and an API laygo has since replaced (`m.query` → `from`): «m.query(db => db.selectFrom("orders as o")...) // mints a DAG edge to a table named "o"» (skills/tickets/SKILL.md:28).
6. **The template covers three skills.** Only data-engineering, frontend and typescript-node are domain skills (README: «precise, verified traps per domain, grouped by problem» (README.md:69)). The other ten have no template, so their shared shapes (checklist, Input/Output opener, numbered sections, session rules, tagline title) are unwritten convention (inferred). herdr has a `## Traps` section that does not use the trap line.
7. **References that point at each other.** The template says «a reference file never links to another» (~/.claude/skill-template.md:14). documentation's references do not use markdown links, so R5 passes, but they point at each other in prose: «(Full treatment: ch06.)» (skills/documentation/references/chapters/ch01-start-here.md:13), «- **Ch 6**: the compass, the decision tool this primer sketches.» (skills/documentation/references/chapters/ch01-start-here.md:59), and the cheatsheet's topic index «| acquisition/application (study/work)» … «ch08, ch11, ch12» (skills/documentation/references/cheatsheet.md:69) (inferred breach of the rule's intent).
8. **Size.** Every body is under 500 lines («A few hundred lines at most, never 500.» (~/.claude/skill-template.md:12)); tracker is the largest at 281. No `.md` reference passes 100 lines; the largest is cheatsheet.md at 88.
9. **Trap lines against the output style** (inferred): the style says «- Write an instruction as what to do or not to do, with no justification.» (output-styles/outputty.md:186), while the template's trap line asks for «how it shows, and the fix» (~/.claude/skill-template.md:24).
