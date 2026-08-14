# SPEC phase — intent, gated

Goal: a shared, precise understanding of **what** to build and **why**, separated cleanly into
business and technical intent. Output lands in the trail (thought-trail) and, once resolved, in
the product docs.

## Load first

Re-read `.claude/product.yaml` (North Star + Language) now as the baseline. Then read whole the two
docs SPEC questions are asked against: `.claude/roadmap.yaml` for the business pass,
`.claude/architecture.yaml` for the technical pass. Every question runs against the current North Star
+ Architecture.

## Run the grilling

**`Read ${CLAUDE_PLUGIN_ROOT}/skills/grill/SKILL.md` now, before the first question.** This is a load, and it
is the same mechanism every other phase of this flow uses (`Read …/plan.md`, `Read …/build.md`) — the one
that demonstrably works. Do not work from a summary of the skill, and do not treat "invoke it if it seems
relevant" as equivalent: the skill is 138 lines carrying nine named techniques, including **"Validate
every claim (non-negotiable)"** and the **assumption ledger** that marks each of the user's premises
grounded / absent / unknown. A one-line paraphrase drops ~97% of it, and the part it drops is the part
that catches a position nobody ran.

**Nothing enforces this load.** No hook checks it, and no gate stops a task graph written without it.
A gate used to claim otherwise; it matched a string this very page prints, so reading this page opened
it. SPEC either runs the grilling or the grilling does not happen. A PLAN built on an ungrilled SPEC
ships premises nobody tested.

Its shape, so you know what you loaded: interview relentlessly **in rounds** — the whole answerable
frontier at once, numbered, each with a recommended answer — backtrack and surface conflicts, run the assumption ledger against what exists / what
doesn't / `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" lessons --json`, and explore the codebase (LSP symbol lookup
where the language has a server, `Grep`/`Glob` otherwise) instead of asking when the answer is
discoverable.

**Simple grilling is the default.** For a non-trivial plan, after grounding, offer the user
**advanced** grilling (an `AskUserQuestion`, cost named) — the `grill` skill's advanced mode
adds a Why → What → How agenda and an expert + adversary panel fanned out as parallel subagents. Simple
stays the default.

Ask in **two distinct passes — never conflate them**:

1. **Business goals.** Who is this for, what outcome, what does "done" mean in user/business terms,
   what is explicitly out of scope. Feeds the **North Star**.
2. **Technical goals.** Constraints, integration points, data shape, trade-offs, what must not
   break. Feeds the **Architecture**.

**First concrete artifact: the target program.** Before architecture is discussed, draft the
**"What we're building towards"** block — a concrete, runnable example of how the final implementation
(or the section this feature serves) will look to the user/agent: the exact code they'll write
(source → transform → destination for pipeline work), with **Input / Output as distinct valid-JSON
blocks**, then descending into per-feature detail (its knobs, each with example JSON I/O). Informed by
the North Star, but not the North Star — it shows the finished surface explicitly. Agree it with the user;
it becomes the build's executable acceptance (PLAN pins the last layer to it, master QA runs it) and the
canonical code every PR write **snapshots** — annotated implemented/pending per layer, with real outputs
(see `references/pr-description.md`).

## Spike — the default, not the fallback

Grilling is cheap talk. Cheap talk cannot settle an empirical question, and **most of what a SPEC decides
is empirical**: does this already work, what does it cost, what breaks if it goes. So a spike is not what
you reach for when the argument stalls — it is what you do **instead of having the argument**.

**State only design positions you have run.** "This won't work", "that would be ambiguous", "this
costs too much" are all claims a spike settles in minutes; a position taken without one is a guess
wearing a rationale. The spike is never the expensive part — the argument is.

**How much spike, by what kind of change:**

| The change is… | Spike |
| --- | --- |
| **A variation on something already here** — a different flavour of an existing shape, and you can point at the evidence it already works | **Quick.** One question, minutes, enough to confirm the shape holds. Not a survey, not a write-up, no "does this make sense" essay. |
| **New capability, or a change in direction** | **Heavily, before any proposal.** No plan is drafted until the spike answers whether it works and what it costs. |
| **A simplification, a deletion, or "can we make this simpler?"** | **Heavily, before any proposal** — and see the deletion rule below, which is the one people skip. |

**Assumptions need existing evidence.** You may build on something only when you can point at what makes
it true — code that already does it, a measurement, a doc you read. "It should work like X" is a spike
waiting to happen, not a premise. This is where SPECs go wrong quietly: an unspiked assumption is
indistinguishable from a settled one three documents later.

### Deleting is a spike too — and the tests are the specification

**Simplification means the same expected outcome with less machinery.** That framing is load-bearing: if
the outcome is unchanged, **the tests that define the outcome must still pass, unchanged.**

- **Keep every test exactly as it is** through a simplification. They are the proof the outcome survived.
  Rewriting a test to fit the new shape converts "I simplified this" into "I changed what it does" without
  anyone noticing.
- **Delete a test only when the feature it covers is being deleted** — when the capability is judged
  useless and will not be supported. That is a **product decision**, not a simplification, and it belongs
  in `roadmap.yaml` (a ❌ row) before the test goes.
- **Run the deletion test first — it is free.** Imagine the thing gone. **If the complexity vanishes, it
  was a pass-through and it goes. If the complexity reappears across N callers, it was earning its keep**
  — it had absorbed that complexity so the callers didn't have to, which is the whole job. This is a
  thought experiment, not a spike, and it costs one minute; run it before you spend anything measuring.
- **Price what you are removing before you scope its removal.** A deletion is a claim that the thing is
  not worth its cost, and that claim needs a number — pricing a scoped kill can invert the verdict.
- **Delete one thing at a time.** The same cycle bundled four separate concerns into one narrative and
  applied a single verdict to all of them; exactly one turned out to be harmful. **A verdict applies to
  the unit you measured, never to the story it arrived in.** If you cannot price it separately, you have
  not scoped it separately.

**How it runs:**

1. **A spike is a test in the repo's own suite.** One file per question, its name carrying
   **`spike-<slug>`** — the same slug the trail line and any resulting claim use, so the three are
   greppable as one thread. It lives where this repo's tests live, runs under the repo's own runner
   (the same one `CHECKS` captures), and is **committed to the branch as it is written** — the user can
   run it themselves and read the cases. A loose script in a scratch folder answers the question and
   then loses the answer; a test keeps it runnable.
2. **Variants are test cases, not separate scripts.** Options A/B/C sit as cases in the one spike file,
   so one run shows side by side which shapes hold and which break — the user picks from passing cases,
   not from prose. Use the canonical data from `docs.js examples --name "<name>"` as the cases' input;
   pin a new shape in `examples.yaml` first when none fits. (A variant that must run inside the app — a UI option — still goes on a
   **throwaway branch that is never merged**; say so when you cut it.)
3. **The answer survives; the spike graduates or dies — tracked either way.** Write the trail line
   (decision + what was dropped), and **record the validated answer where its reader works**: external
   system/library/platform → a `kind: limitation` entry in the architecture index (or a CLAUDE.md
   standing rule), whose **re-verification probe is "run the spike test"** — a spike that grounds a
   routed fact **stays in the suite** as its standing
   revalidation; a fact about this repo's own code → `architecture.yaml`'s verified constraints. Then
   **redraft the target program above** with what you learned. A dead-end spike is **deleted in the
   same session** — a tracked commit, never an orphaned file. Either way BUILD works from the
   `contract` and its test, never from spike code, so a spike's shortcuts can't ride into production
   under "cleanup".

**Quick spikes stay quick.** A variation on something that exists gets one question and a run, not a
report. The write-up is the trail line; if you are drafting sections, you have turned a five-minute check
into the deliverable.

A spike can fire mid-grilling — take the answer back into the interview and carry on. It also serves
PLAN: a design fork found there comes back here as a spike per candidate. Not to be confused with
**`stage: prototype`** (BUILD — the first *real* commit, kept and matured). A spike's artifact is always
discarded.

## Log the thought-trail — before the next question, every time

**The trail is this branch's map**, at `.claude/trails/<branch>.trail.yaml`. It is a YAML mapping of
four sections: the **destination**, **decisions**, **not_yet_specified** (the fog), and
**out_of_scope**. Author it as YAML text by hand, and query it with
`docs.js trail <branch> --section <name>` rather than reading it whole:

```yaml
core_objective: |
  <What reaching the end of this looks like — the spec, decision, or shipped change this cycle is
  heading for. One or two lines. It fixes the scope: work beyond it is out of scope, not fog.>

decisions:
  # one record per settled question: enough to judge relevance, then follow the link for the detail
  - question: <the question, named>
    answer: |
      <the answer, in prose>, and what was dropped.
    link: <where the detail is filed, e.g. "product.yaml north_star" or "hooks/session.js:105">

not_yet_specified:
  # the fog: in-scope questions you can SEE but cannot yet phrase sharply. Delete a patch when it
  # graduates into a decision or a task — it then lives only there.
  - <the suspected question, as loosely or fully as the view allows>

out_of_scope:
  # ruled beyond the destination. Closed, never graduates, and deliberately NOT a decision.
  - item: <the gist>
    reason: <why it is out>
```

`link` is not optional; write `""` when the detail has no home yet. **Task / fog / out-of-scope is
MECE**: every piece of known work is exactly one of the three. The last two sections are the ones that
get skipped and the ones that pay:

- **Fog** is a question you can *see* but cannot yet phrase sharply, because it hangs on something still
  open. **The test is whether you can state the question precisely now — not whether you can answer it
  now.** Sharp → it can become a task, even if blocked. Not sharp → it goes in **Not yet specified**, and
  it does **not** get pre-sliced into task-shaped pieces. An unknown recorded as an unknown is a signpost;
  the same unknown guessed into a task is the re-plan you pay for later.
- **Out of scope** is work past the destination. It is a **scoping act, not a decision** — one line saying
  what and why, kept out of *Decisions so far*, and it never graduates.

**Write the trail record for the answered question BEFORE asking the next one — no exceptions.**
Append one record to the `decisions:` list in `.claude/trails/<branch>.trail.yaml`: `question` (the
question, named), `answer` (what was decided, and **what was branched or dropped** — the alternatives
considered and set aside), and `link` (where the detail lives, or `""`). This is not passive note-taking —
it is crash insurance: a session that dies mid-grilling with decisions living only in chat forces
recovery from raw transcripts (verified live: several locked API decisions existed nowhere else).
Keep it terse, one line per node.

## Resolve into the product docs

When a business or technical point crystallises, write it into its doc immediately — **each decision has
exactly one home** (the full rules + skeletons live in
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md` — read it):

| The decision is about | It goes to |
| --- | --- |
| **Why this exists** — the pitch, the wedge, a canonical term | `.claude/product.yaml` (North Star + Language). Small on purpose: every session reads it. |
| **What we're building** — a target's status | `.claude/roadmap.yaml` — one row per target you can name in one sentence, status-badged (✅/🔨/📋/❌), deps before dependents, each row a mini-spec `summary` (problem → solution → e2e snippet with example I/O). A live row links its plan (`trails/<branch>.trail.yaml`); a shipped row closes clean into its `roadmap/<name>.md` writeup. Target-level — never the task graph, never task-shaped work. |
| **Tracked work** — a bug, a debt item, a task | `.claude/tasks.yaml` — one index record (`id`/`kind`/`status`/`deps`/`summary`/`link`), plus a `.claude/tasks/<slug>.md` breakdown doc when the one-liner is not enough. |
| **The surface and its machinery** — a feature, a knob, a limitation, a pattern, a seam | `.claude/architecture.yaml` — one index record per entry (`what`/`how`/`doc`/`example`/`related`), depth in its self-contained `.claude/architecture/<topic>.md` topic file. Seams in `protocols` as parent-supplies → child-returns (PLAN derives `contract`s from them). **Mermaid inline** — never SVG, never a separate `.mmd` file. |
| **The past** — a pivot, an abandoned approach | `.claude/lessons.yaml` — append-only, written at the merge step, not from here. |

**Verify before you write.** Any claim about **already-shipped** behaviour (a ✅ feature, an existing
API/flag) must be **run in the codebase first** — real output, no guessing (see the template's hard
rule). Target behaviour (🔨/📋) is shown as *expected*, marked, never asserted as shipped.

The three living docs are **pruned, never append-only**: delete what a new decision makes stale — a real
pivot worth remembering moves to `lessons.yaml`, the one archive. No separate `CONTEXT.md`, no ADRs.

## Gate

Do not proceed to PLAN until the user confirms the spec is right.
