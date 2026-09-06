# Chapter 2: Tutorials

## Core Idea

A tutorial is a lesson: a practical, learning-oriented experience in which the student learns by doing something meaningful under a tutor's guidance. Its purpose is not to get something done but to help the user learn - and nearly all the responsibility falls on the teacher.

## Frameworks Introduced

- **The tutorial as a lesson**: a contract between teacher and pupil in which the teacher is responsible for what the pupil learns, what they do to learn it, and their success. The pupil's only responsibility is to be attentive and follow directions. There is no responsibility on the pupil to learn, understand, or remember.
- **Obligations of the teacher**: every exercise must be _meaningful_ (the pupil has a sense of achievement), _successful_ (the pupil can complete it), _logical_ (the path makes sense), and _usefully complete_ (it encounters all the actions, concepts, and tools the pupil needs to become familiar with).
  - When to use: as the acceptance checklist for any tutorial you write or review.
- **The first rule of teaching: don't try to teach.** Provide an experience through which learning can happen. You cannot make the student learn; you can only make it so they can learn.

## Key Concepts

- **Learning by doing**: what the student does is not necessarily what they learn - through doing they acquire facts, understanding, familiarity, names of things, tools, workflows, concepts.
- **Narrative of the expected**: continuous feedback that the learner is on the right path ("You will notice that…", "After a few moments, the server responds with…").
- **The feeling of doing**: the accomplished practitioner's joined-up purpose, action, thinking, and result; the tutorial's tasks should be a cradle for discovering it.
- **Anti-pedagogical temptations**: abstraction and generalisation, explanation, choices, information - all of which jeopardise the learning experience.
- **Perfect reliability**: a tutorial must work for every user, every time; confidence is built layer by layer and easily shaken.

## Mental Models

- You are required to be present, but condemned to be absent: a live teacher rescues a struggling student; your written tutorial cannot, so it must be constructed so things can't go wrong.
- All learning moves in one direction: from the concrete and particular toward the general and abstract. Minds perceive general patterns from concrete examples - never the reverse in a lesson.
- Repetition is not the best teacher - sometimes it's the only teacher. Learners repeat a successful step just to see the same thing happen again; make steps repeatable.

## Anti-patterns

- **"In this tutorial you will learn…"**: presumptuous and a very poor pattern. Say instead what will be built: "In this tutorial we will create and deploy a scalable web application."
- **Explaining mid-lesson**: explanation distracts from doing and blocks learning. "We're using HTTPS because it's more secure" plus a link is the ceiling.
- **Offering options and alternatives**: different flags, different approaches - ignore them all; guide one path to a successful conclusion.
- **Conflating tutorials with how-to guides**: the single most common conflation in software documentation (see ch11).

## Worked Example

The language of tutorials, pattern by pattern:

- "We…" - first-person plural affirms the tutor-learner relationship: you are not alone.
- "In this tutorial, we will…" - describe what the learner will accomplish.
- "First, do x. Now, do y. Now that you have done y, do z." - no room for ambiguity or doubt.
- "We must always do x before we do y because… (see Explanation for more details)" - minimal explanation in the most basic language, with a link out.
- "The output should look something like…" - clear expectations.
- "Notice that… Remember that… Let's check…" - clues that confirm the learner is on track.
- "You have built a secure, three-layer hylomorphic stasis engine…" - describe (and mildly admire) what the learner accomplished.

The cooking-lesson analogy makes the priorities concrete: teaching a child to cook, it doesn't matter what the child makes or how correctly. Success is not the culinary outcome - it's that the child acquires the knowledge and skills you hoped to impart, discovers pleasure in the kitchen, and wants to return. The lesson may be framed as "learning to prepare a dish", but what the child actually learns is washing hands before handling food, holding a knife, why the oil must be hot. If the lesson ends early - normal, with a child - as long as something was achieved and enjoyed, expertise was laid down that can be built on next time.

## Key Takeaways

1. Check every tutorial against the four obligations: meaningful, successful, logical, usefully complete.
2. Deliver visible results early and often; every step should produce a comprehensible result the learner can see as meaningful.
3. Maintain a narrative of the expected, point out what the learner should notice, and flag likely signs of going wrong ("If the output doesn't show…, you have probably forgotten to…").
4. Ruthlessly minimise explanation; link out instead. Explanation is only pertinent at the moment the user wants it - and that moment is not for the author to decide.
5. Stay concrete and single-path: no abstractions, no choices, no digressions.
6. Aspire to perfect reliability, and expect to find flaws only through extensive testing and observation of real users.
7. Expect tutorials to be your most revision-hungry documentation: changes cascade through the end-to-end learning journey rather than staying discrete.

## Connects To

- **Ch 11**: the full tutorial vs how-to guide distinction.
- **Ch 5**: where the explanation you cut from the tutorial belongs.
- **Ch 10**: "flow" and "anticipating the user" as deep quality, which tutorials depend on most.
