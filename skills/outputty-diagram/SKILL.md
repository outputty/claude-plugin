---
name: outputty-diagram
description: Produce a committed SVG diagram — flowchart, swimlane, architecture graph, or data-flow — for a README, doc, or PR description. Opt-in: outputty never forces a diagram; reach for this only when a picture genuinely helps.
---

# outputty:diagram

Produce a **self-contained SVG** — one that renders standalone on GitHub, in a README, and in the
chat widget, with no external CSS or host variables. Two complete reference SVGs ship in
[`examples/`](examples/): copy one, adapt it. This skill is the how-to and the hard-won layout and
embedding rules on top of the house style.

This is **opt-in**. outputty owns a text flow; it does not mandate diagrams. Use this when the author
(or a build task) wants to visualize a flow or an architecture — availability, not enforcement.

**Boundary — SVG is for humans.** This skill serves **human-presentation** surfaces: the README and PR
bodies/comments. Markdown an **agent** consumes (product.md, trails, briefs) gets **Mermaid** instead —
an agent reads text, not pictures — so this skill is the wrong tool there.

## House style (always, so it renders standalone)

- **Explicit hex `fill`/`stroke`** on every shape and font styling in an inline `<style>` block — no
  host CSS variables, no external classes (those only render inside the chat widget).
- A light card background `<rect>` so it reads on GitHub light and dark themes.
- `role="img"` with a `<title>` and `<desc>` for accessibility.
- **Colour by category/layer, ≤3 coloured ramps + neutral gray**, with a 1-line legend when colour
  encodes meaning. **Sentence case** on every label.
- `viewBox="0 0 680 H"` for a simple top-down flow (chat-widget friendly); keep content within
  `x=40..640` and trim height to the last element + ~20px. Widen freely for a wide swimlane.

## Shapes — every diagram, not just swimlanes

The shape *is* the semantics; readers parse a flowchart by silhouette before they read a word. This
vocabulary is **mandatory in every flow diagram**:

- **Process / stage** = rounded rect (`rx≈7`).
- **Decision = diamond** (`<polygon>`), **always**. Any branch point — an `if`/`switch`/`case`, a
  gate/guard that can stop or skip the flow, a yes/no fork — is a diamond. **Never draw a conditional
  as a rounded rect, and never leave it as a bare text label on an edge.** Label every outgoing edge
  with its branch condition in a white chip.
- **Start / stop / terminal** = terminator pill (rounded rect, large `rx≈16`). A "gate off → stop"
  outcome is a terminator, reached from the decision diamond's negative edge.

❌ Don't: a `<rect>` labelled "switch"; an edge captioned "if X → stop" with no node.
✅ Do: a diamond holding the condition, a `no`-chipped edge to a `stop` pill, a `yes`-chipped edge
continuing. Keep the diamond's question ≤2 short lines centred at its widest part; push detail to edge
chips or a caption beside it.

## Sections — the band standard (use it EVERYWHERE)

Every section of a flow is a **band**, defined exactly one way, so the eye parses structure at a
glance. A band is:

- a **label at the far left** (`class="band"`, `x=24`) naming the section — `SPEC · GATED (you)`,
  `BUILD · RUN LAYER`, `BUILD · MASTER QA` — and
- a **full-width horizontal rule** just under it (`x1=24 … x2=<viewBoxW−24>`), spanning the whole card.

The section's nodes sit below the rule, centred on the flow's column, until the next band. A top-level
phase and a sub-stage are the **same shape** — one band each; show the grouping in the *name*
(`BUILD · LAUNCH`, `BUILD · LOOP`, `BUILD · RUN LAYER`, `BUILD · MASTER QA`, `BUILD · MERGE`). Accent
the rule for a hands-off / workflow band, keep it neutral for an interactive one — see the
[section-band component](#components-copy-paste).

**Never invent a second section style** — no indented mini-labels, no boxed sub-headers. A deviation
from the band shape reads as "this isn't a section", which is exactly the confusion to avoid. If it's
a stage of the process, it gets a band.

### Loops across sections

- **One stage per section — never squish.** A loop's entry, its body, the conditional that exits it,
  and a downstream check are *distinct stages*. Each gets its **own band**. Cramming them into one
  container is the #1 way a flow becomes unreadable.
- **A loop that's part of a bigger process spans sections — don't coil it in one box.** Route the
  **loop-back as an arrow between bands**: from the exit conditional (a diamond — "more? / last one?")
  back **up to the band it re-enters**, joining the arrow that already feeds that band. The loop reads
  as a path across sections, not a coil in a corner.
- A **post-loop stage** (e.g. a final whole-output check) and **whatever follows it** are each their
  own band too — reached by the conditional's exit edge, never drawn inside the loop.

Example (drain a queue, then finalize) — five bands, one loop-back arrow: `LOOP entry — next item`
→ `WORK — do the item` → `‹more?›` — **no** loops back up to the *WORK* band; **yes** drops to a
separate `FINAL CHECK` band, then a separate `SHIP` band. Not one box with everything crammed in.

## Default workflow

1. **Build** the SVG (named after the subject).
2. **Validate the XML first** — a malformed SVG silently fails to render on GitHub:
   `node -e "require('fs').readFileSync(process.argv[1],'utf8');" f.svg` won't catch structure, so use
   a real parser: `python3 -c "import xml.dom.minidom as m; m.parse('f.svg'); print('ok')"` (or any XML
   validator you have).
3. **Check text fits its box** (see Spacing). Overflow is the #1 defect and you can't always see it in
   preview.
4. **Embed** (see Embedding) and re-validate.

## Swimlanes (the powerful one)

A swimlane is a **layers × stages matrix** — the model for any multi-actor or multi-level flow. Its
layout rules (layer/stage placement, column alignment, orthogonal connectors, nested levels, feedback
loops) are detailed, so they live in **[`references/swimlane.md`](references/swimlane.md)** — read it
when you're drawing one.

## Spacing & padding (do not squish)

- **Gutters & alignment:** leave a clear band between layer rows and a clear gutter between stage
  columns; never butt them edge-to-edge. Snap every box to its stage column `x`.
- **Box padding:** a box must be **wider than its text**. Estimate width ≈ `chars × 0.6 × font-px`
  (sans) / `× 0.62` (mono); leave ≥10px each side. If it overflows: widen, drop the font a step, or
  wrap to multiple `<text>` lines. A smaller class for long labels beats shrinking everything.
- **Pills:** reduce `rx` (≈16, not 20+) — fat corners eat text on a narrow pill; widen before rounding.
- **Vertical rhythm:** ~100–120px between row centres; don't pack rows.
- **Edge labels:** put `Yes`/`No` in a **small white chip** (`rect fill=#FFF` rx≈5) on the connector.
- **Legend:** leave ≥20px above and below it; don't hug the last lane or card edge.

## Embedding

- **README / any `.md` file view:** a relative path renders fine — `![alt](path/to/f.svg)`.
- **PR / issue descriptions:** relative paths do **not** render in PR bodies. Use the same-origin
  `github.com/<owner>/<repo>/raw/<branch>/` form — it renders inline (and works on private repos for
  logged-in members):

  ```markdown
  ![alt](https://github.com/<owner>/<repo>/raw/<branch>/path/to/f.svg)

  > source: [`path/to/f.svg`](https://github.com/<owner>/<repo>/blob/<branch>/path/to/f.svg)
  ```

  The file **must be pushed to `<branch>` first**, or the URL 404s. Edit the body with
  `gh pr edit <n> --body-file` (assert the old anchor is present before replacing).

## Gotchas

- `raw.githubusercontent.com` needs a token on a private repo → 404 / `text/plain` when unauth. Use
  `github.com/<owner>/<repo>/raw/<branch>` instead — it's the route that reliably renders.
- GitHub serves `.svg` from raw as `text/plain` and **strips inline `<svg>` and `data:` URIs** from
  markdown bodies — you cannot inline an SVG into a PR/issue body. The `raw/<branch>` route is the only
  one that renders.
- Escape `>` and `&` in SVG text as `&gt;` / `&amp;`. Avoid exotic glyphs that don't render in all
  fonts — draw legend shapes as tiny `<polygon>`/`<rect>` instead.

## Components (copy-paste)

Build a diagram by **composing these components** — one `<g>` per section, each section a *band* plus
its nodes. Put `<defs>` + `<style>` once at the top; reuse the rest. This is the vocabulary the
[section standard](#sections--the-band-standard-use-it-everywhere) and the shipped SVGs are built from.

**Defs + palette** (once):

```xml
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5"
    orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round"/></marker>
  <marker id="arrowp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5"
    orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#6B5BD6" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round"/></marker>
</defs>
<style>
  .band{font-size:11px;font-weight:700;fill:#534AB7;letter-spacing:.06em}
  .th{font-size:13px;font-weight:600;fill:#2C2C2A}   /* node title   */
  .t {font-size:12px;font-weight:600;fill:#2C2C2A}   /* diamond text */
  .ts{font-size:10.5px;fill:#5F5E5A}                 /* node subtitle*/
  .chip{font-size:9.5px;font-weight:700}
  .nbox{fill:#F3F2EF;stroke:#C9C7C0;stroke-width:1.3} /* interactive step   */
  .wfc {fill:#EEEDFE;stroke:#6B5BD6;stroke-width:1.6} /* hands-off workflow */
  .dia {fill:#FFFFFF;stroke:#6B5BD6;stroke-width:1.5} /* decision           */
  .stop{fill:#FBEBE9;stroke:#B0413E;stroke-width:1.6} /* stop / escalate    */
</style>
```

**Section band** — every section opens with one (accent rule for a workflow band, neutral `#E5E3DC`
for an interactive one):

```xml
<text class="band" x="24" y="Y">BUILD · RUN LAYER</text>
<line x1="24" y1="Yr" x2="836" y2="Yr" stroke="#6B5BD6" stroke-opacity="0.45" stroke-width="1"/>
```

**Process box** (`nbox`, interactive) / **workflow box** (`wfc`, hands-off) — same shape, swap class:

```xml
<rect class="nbox" x="170" y="Y" width="300" height="50" rx="8"/>
<text class="th" x="320" y="Y" text-anchor="middle">Run layer · parallel tasks</text>
<text class="ts" x="320" y="Y" text-anchor="middle">Haiku exec → Sonnet QA → commit</text>
```

**Decision diamond** — every branch point; chip each outgoing edge:

```xml
<polygon class="dia" points="320,T 372,C 320,B 268,C"/>  <!-- T=top y, C=centre y, B=bottom y -->
<text class="t" x="320" y="C" text-anchor="middle">Last</text>
<text class="t" x="320" y="C" text-anchor="middle">layer?</text>
```

**Terminator / stop pill** (start, or a stop/escalate off a diamond's negative edge):

```xml
<rect class="stop" x="X" y="Y" width="250" height="40" rx="18"/>
<text class="th" x="X" y="Y" text-anchor="middle">Escalate on double-fail → you</text>
```

**Edge chip** (`yes`/`no`/`drained` on a connector):

```xml
<rect x="Cx" y="Cy" width="54" height="16" rx="5" fill="#FFFFFF" stroke="#E5E3DC"/>
<text class="chip" x="Cx" y="Cy" text-anchor="middle" fill="#0F6E56">yes</text>
```

**Connector** (straight) and **loop-back** (exit conditional → margin → up → into the arrow feeding
the re-entered band):

```xml
<line x1="320" y1="Y1" x2="320" y2="Y2" stroke="#888780" stroke-width="1.3" marker-end="url(#arrow)"/>
<path d="M268,DY L150,DY L150,TY L320,TY" fill="none" stroke="#6B5BD6" stroke-width="1.5"
  marker-end="url(#arrowp)"/>
```

[`docs/flow.svg`](../../docs/flow.svg) is composed entirely from these — read it to see the components
wired into `<g id="section-…">` groups.

## Worked examples

Two complete, self-contained reference SVGs ship in [`examples/`](examples/) — both render standalone.

- [`examples/flowchart.svg`](examples/flowchart.svg) — a **top-down process flowchart**: phase-band
  labels down the left, **one accent ramp for the hands-off / workflow track** vs neutral for
  interactive steps, a decision diamond with branch chips, approval **gate diamonds that loop back on
  reject**, an **optional** dashed branch, a bordered workflow container, and start / stop terminator
  pills. The model for any process or decision flow.
- [`examples/swimlane.svg`](examples/swimlane.svg) — a **layers × stages swimlane**: layers placed by
  *where output is produced*, four labelled stage columns, column-aligned orthogonal flow, a decision
  diamond with `approve`/`reject` chips, two levels shown via solid (workflow) vs dashed (activity)
  borders, and a memory layer a review step writes to and the next run reads. The model for any swimlane.
