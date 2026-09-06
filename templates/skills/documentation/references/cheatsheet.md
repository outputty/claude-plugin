# Cheatsheet

## Classify first - the compass

| Informs…            | Serves…             | Form             |
| ------------------- | ------------------- | ---------------- |
| action (doing)      | acquisition (study) | **tutorial**     |
| action (doing)      | application (work)  | **how-to guide** |
| cognition (knowing) | application (work)  | **reference**    |
| cognition (knowing) | acquisition (study) | **explanation**  |

Two questions, asked of a sentence or a whole document. When you feel doubt or friction while writing, stop and re-run them - friction usually means wrong quadrant.

## The four forms at a glance

|  | Tutorial | How-to guide | Reference | Explanation |
| --- | --- | --- | --- | --- |
| answers | "Can you teach me to…?" | "How do I…?" | "What is…?" | "Why…?" |
| form | a lesson | steps with conditions/branches | dry description | discursive discussion |
| reader is | a learner (teacher is responsible) | competent, at work (reader is responsible) | at work, consulting | away from work, reflecting |
| structured by | the managed learning path | the user's real-world task | the machinery itself | the topic ("About x") |
| analogy | teaching a child to cook | a recipe | the food packet label | culinary social history |

## Decision rules

- Writing steps? If the reader is here to _become able_, it's a tutorial - one path, no choices, safe, explicit basics. If they're here to _get it done_, it's a how-to - branches, assumed competence, real world.
- Writing facts? If consulted during the task, it's reference - describe and only describe. If read away from the task, it's explanation - discuss, contextualise, admit opinion.
- Urge to explain inside a tutorial or how-to guide? One basic clause + link out. Never inline.
- Urge to instruct inside reference or explanation? Link to the guide. Never inline.
- Basic vs advanced does NOT map to tutorial vs how-to: how-tos cover basic chores; experts still take tutorials. Only study vs work decides.
- Structuring reference? Mirror the code's structure (module/class/method). Structuring anything else? Follow user needs, never product features.
- Improving existing docs? Pick the thing in front of you, improve one small piece, publish, repeat. Never build empty four-section scaffolding; never tear down and restart.
- A "new documentation type" (FAQ, quickstart, cookbook…)? It's a presentation format - decompose its content with the compass; there are only four needs.

## Titles

- How-to: "How to integrate application performance monitoring" (verb, exact task). Not "Integrating APM", not "APM".
- Explanation: must accept "About…" in front. Scope with a why-question.
- Tutorial framing: "In this tutorial we will create…" - never "you will learn…".

## Tells and smells

| If you see… | You have… | Fix |
| --- | --- | --- |
| choices/alternatives in a tutorial | how-to leakage | cut; one path to success |
| "you will learn", teacherly explaining | anti-pedagogy | show, don't teach; link explanation out |
| tool-motion steps ("press Deploy to deploy") | machinery-defined how-to | rewrite around the user's real goal |
| why/history in a reference entry | explanation creep | split to "About x", link |
| unstitchable open-endedness while writing | probably explanation without a why-question | pick the why, draw the topic boundary |
| a step users can't repeat or recover from | tutorial safety violation | make it repeatable/restartable |
| boring lists and tables | reference (good - keep it austere) | resist livening it up |
| docs structured by product features | the structure problem | classify content by need, let structure emerge |

## Quality split

- Functional quality (accuracy, completeness, consistency): objective, measurable, independent; any lapse is visible; deep quality is impossible without it.
- Deep quality (flow, fit, anticipation, beauty): subjective, interdependent, judged not measured; Diátaxis creates its preconditions but is not a formula.
- Diagnostic move: apply Diátaxis boundaries to existing docs and watch what becomes visible - reference gaps (against code structure), tutorial hand-waving (once explanation is removed).

## The user's cycle

learning → goals → information → understanding → (repeat, deeper). Serve every phase; don't force the reading order.

## Topic index

| Topic                                                 | Chapter                           |
| ----------------------------------------------------- | --------------------------------- |
| action/cognition                                      | ch06, ch08                        |
| acquisition/application (study/work)                  | ch08, ch11, ch12                  |
| blur, boundaries                                      | ch09, ch11, ch12                  |
| compass                                               | ch06, ch01                        |
| explanation                                           | ch05, ch12                        |
| FAQ / fifth documentation types                       | ch08                              |
| flow                                                  | ch03, ch10                        |
| how-to guides                                         | ch03, ch11                        |
| map                                                   | ch09, ch08                        |
| naming and titles                                     | ch03 (how-to), ch05 (explanation) |
| organic growth, iteration, migration of existing docs | ch07                              |
| pedagogy, teaching, learning                          | ch02                              |
| quality (functional, deep)                            | ch10                              |
| reference                                             | ch04, ch12                        |
| structure (of docs sites, of reference)               | ch09, ch04, ch07                  |
| tutorials                                             | ch02, ch11                        |
| workflow                                              | ch07, ch01                        |

## Source and license

Diátaxis, by Daniele Procida ([diataxis.fr](https://diataxis.fr)), licensed [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This directory is a derivative work under that license; redistribute it, if at all, under the same terms.
