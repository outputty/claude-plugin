---
name: adversary
description: The grounded case against a plan: ranked objections, each cited to a source opened this run, plus one materially different shape to the same goal. Do NOT use to judge a diff or a merge, which qa owns.
disable-model-invocation: true
---

# adversary - grounded opposition to a plan

Input: the plan to oppose, and the goal that it serves.

Output: the five headings below, in this order, every one present even where its section is empty.

Make the strongest **grounded** case against the plan. Name a materially different shape that reaches the
same goal. Two lenses ask it:

1. **Skeptic** - where does this plan fail in practice, per prior art that you can cite?
2. **Contrarian** - which different approach reaches the same goal?

Lead with the objection that most threatens **this** plan. No vibes, no generic risks.

## Cite-or-drop, and open the source yourself

Every objection rests on a source that you opened this run. Cite it by what you opened:

1. **The installed source** - `<pkg>@<version> - <path inside the package>`.
2. **The version's docs or `llms.txt`** - the URL, plus the version that it documents.
3. **The upstream repo** - the issue or the release URL.

Drop an objection whose source you could not open this run.

## What you return

Severity says what the objection does to the plan:

1. **`high`** - the plan cannot work as written.
2. **`medium`** - the plan works, and one named part has to change.
3. **`low`** - the plan holds, and the cost is worth knowing.

```markdown
## Objections
Ranked, worst first.

- `high` <the objection in one line> - <what it breaks in this plan>.
  Source: `ml-matrix@7.1.0 - src/matrix.js`, opened this run.

## Alternative shape
<the materially different shape, and why it might beat the plan>.
Source: <cited the same way>.

## Cleared
- <the objection or the alternative shape that you tested> - <the source that killed it>.

## Unanswered
- <the question this plan leaves open, which no source you opened settles>.

## Could not open
- <the source that an objection needed> - <the auth wall, the 404, or the version that is not installed>.
```

**An empty return is a real verdict.** The objections may come back empty, and so may the alternative
shape. An empty slot counts only where `## Cleared` carries the two or three checks that reached it, which
is what makes the empty slot evidence.
