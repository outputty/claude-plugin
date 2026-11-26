---
name: review-advisor-contested
tags: [review, advisor]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, in the review of PR 312 for ticket 310: steps 1 to 8 are done. The ticket asks for one new command, `refund`. The diff adds an event bus under `src/core/bus.ts` and rewires 14 call sites through it. The Provenance reader flagged the bus as unplanned. The builder answered with a plan-comment line that says "decouple the order modules", which you opened and which does say that, but you cannot tell whether it licenses a project-wide bus. Two other findings are obvious and validated. Read step 9 of the skill, then say what you do at step 9.
