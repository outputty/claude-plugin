# Chapter 11: The Difference Between a Tutorial and a How-to Guide

## Core Idea

The tutorial/how-to conflation is the single most common conflation in software product documentation. Both are practical guides with ordered steps, which is why they're mistaken for each other - but a tutorial serves the user at study (its obligation: a successful learning experience) and a how-to guide serves the user at work (its obligation: help accomplish a task).

## Frameworks Introduced

- **Study vs work as the discriminator**: sometimes the user is at study, sometimes at work; documentation must serve both needs, and which need is being served - not topic, not difficulty - is what distinguishes the two forms.
- **The contrast table** (each row emerges from the study/work distinction, none are arbitrary):

  | Tutorial | How-to guide |
  | --- | --- |
  | helps the pupil acquire basic competence | helps the already-competent perform a task correctly |
  | provides a learning experience; what matters is what the learner does and experiences | directs the user's work |
  | carefully-managed path from start to conclusion, with required encounters along it | aims for the surest way to the goal, but the path can't be managed - it's the real world |
  | familiarises the learner with tools, language, processes | assumes familiarity with them all |
  | contrived setting, set out in advance for success | the real world, dealing with what it throws at you |
  | eliminates the unexpected | prepares for the unexpected and how to deal with it |
  | single line; no choices or alternatives | forks and branches: "If this, then that. In the case of…, an alternative is…" |
  | must be safe; always possible to go back and start again | cannot promise safety; often one chance to get it right |
  | responsibility lies with the teacher | the user is responsible for getting themselves in and out of trouble |
  | learner may not know enough to ask the questions it answers | can assume the user asks the right questions |
  | explicit about basic things - where to type, how long to wait, the embodied experience | relies on this as implicit, even bodily, knowledge |
  | concrete and particular: the specific tools and conditions set before the learner | general: real-world cases differ and can't be known in advance |
  | teaches general skills applicable to a multitude of cases | is followed to complete one particular task |

- **The basic/advanced trap**: tutorials-for-beginners, how-tos-for-experts is an understandable but wrong reading. How-to guides can, do, and should cover basic procedures (paperwork completion, materials disposal); an advanced practitioner still enters training. The difference lies in the need served: study or work.

## Key Concepts

- **What they share**: both are practical guides containing directions; both set out ordered steps promising success; neither makes sense except for a user with hands on the machinery.
- **Safety and success**: a clinical manual that conflated education with practice "would be a literally deadly document". Software conflations rarely kill, but they add low-level inconvenience and unhappiness every time a published guide doesn't know whether it serves study or work - and they drive away exactly the newcomers you hope to turn into committed users.

## Mental Models

- Ask: is the reader here to become someone who can do this, or to get this done? The first needs a lesson, the second directions.
- Difficulty is orthogonal to form: "Difficult neonatal intubations" for a veteran anaesthetist is still a tutorial - same form and need as the first-year suturing lesson, with a wholly different baseline of skill.

## Worked Example

The medical pair the chapter builds on:

**At study - the suturing lesson.** Early in training you learn to suture in a lab: skin pads on benches, exactly the right equipment provided, step-by-step demonstration, then your own fumbling attempt - a ragged cut, a dropped needle, a telling-off for breaking sterility - with feedback and correction from the tutor until crude stitches happen at all. You'll return to the lesson again and again until fumbling becomes confident practice. It's a lesson, safely in the hands of an instructor responsible for the pupil's success. What was produced (an ugly stitched pad) is irrelevant; what was acquired matters.

**At work - the appendectomy manual.** The clinical manual for a standard appendectomy lists equipment and personnel, stationing, tool layout, step-by-step actions through to post-operative handover. Steps depend on open vs laparoscopic, available imaging, infant or juvenile patients, mid-procedure conversion - "if this, then that". The team checks it before and sometimes during the procedure. It teaches nothing: the surgeons already have their skills. It guides competent practice safely through one task.

The distinction between the medical-school lesson and the clinical manual _is_ the distinction between a tutorial and a how-to guide.

## Key Takeaways

1. Classify by need served - study or work - never by topic or difficulty.
2. A tutorial's product is the learner's competence and confidence; a how-to guide's product is the completed task.
3. Tutorials: one managed path, safety, explicit basics, teacher-owned responsibility. How-to guides: branching real-world paths, assumed competence, user-owned responsibility.
4. The worst structural failure in documentation is these two collapsing into each other, defeating both needs - guard this boundary hardest.

## Connects To

- **Ch 2**: tutorials in full.
- **Ch 3**: how-to guides in full.
- **Ch 9**: this is the "guide action" edge of the map, where blur is most damaging.
