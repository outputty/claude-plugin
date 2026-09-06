# Chapter 4: Reference

## Core Idea

Reference is information-oriented technical description of the machinery and how to operate it - austere, authoritative, consulted rather than read. Uniquely among the four forms, its content is led by the product it describes, not by user tasks.

## Frameworks Introduced

- **Describe and only describe**: neutral description is the key imperative. Explaining, instructing, discussing, and opining are natural ways of communicating - and all run counter to reference, which demands accuracy, precision, completeness, and clarity. When description feels inadequate, link to how-to guides, explanation, and tutorials instead of absorbing them.
- **Respect the structure of the machinery**: the structure of reference documentation should mirror the structure of the product, so the user can work through code and docs at the same time - the way a map corresponds to territory. Not a forced, unnatural structure: the logical, conceptual arrangement of the code should help make sense of the documentation.
- **Adopt standard patterns**: reference is useful when consistent; place material where users expect to find it, in a familiar format. Reference is not the place to display an extensive vocabulary or command of styles.

## Key Concepts

- **Information-oriented**: contains propositional or theoretical knowledge a user looks to in their work.
- **Consulted, not read**: one hardly reads reference material; one consults it.
- **Wholly authoritative**: no doubt or ambiguity; users need truth and certainty - firm platforms on which to stand while they work.
- **Neutrality**: reference is not concerned with what the user is doing (the marine chart serves navigator and judge equally).
- **Examples in reference**: valuable illustration that avoids the trap of explaining or instructing - a usage example can illustrate a command and its context succinctly.

## Mental Models

- Reference is a map: it tells you what you need to know about the territory without your having to go and check the territory yourself.
- Think of the food packet: when you need ingredients, storage, or allergy facts, you expect standard presentation, instant findability, and total reliability - and certainly no recipes or marketing claims mixed in. That mix-up "could be literally dangerous", which is why food labelling is governed by law; the same seriousness applies to all reference.

## Anti-patterns

- **Auto-generated reference as the whole of documentation**: generation from code is powerful for keeping reference faithful to the code, but too many developers think it's all the documentation required.
- **Instruction and explanation creep**: introduced because bare description "can seem too inadequate to be useful". It isn't - link out.
- **Structure detached from the code**: if a method belongs to a class in a module, the documentation should show the same relationship (this also makes gaps visible - see ch10).

## Worked Example

The language of reference, pattern by pattern:

- "Django's default logging configuration inherits Python's defaults. It's available as django.utils.log.DEFAULT_LOGGING and defined in django/utils/log.py" - state facts about the machinery and its behaviour.
- "Sub-commands are: a, b, c, d, e, f." - list commands, options, operations, features, flags, limitations, error messages.
- "You must use a. You must not apply b unless c. Never d." - provide warnings where appropriate.

Note what is absent: no "you might want to", no "because", no walk-through. Facts, lists, constraints, warnings.

## Key Takeaways

1. Let the product's own structure dictate the reference structure; user needs dictate the other three forms, but reference is led by the machinery.
2. Describe neutrally; every urge to explain or instruct is a link to another part of the documentation.
3. Be austere and uncompromising: consistency and standard patterns beat elegance and variety.
4. Reference may describe how something works and the correct way to use it - description of behaviour is still description, not task guidance.
5. Use examples as illustration, watching that they don't grow into explanation (see ch12).

## Connects To

- **Ch 12**: the reference vs explanation boundary and how examples cause slippage across it.
- **Ch 3**: the guides that consume reference's full option lists via links.
- **Ch 10**: mirroring code structure exposes documentation gaps - a functional-quality effect.
