---
name: diagram
description: Produce a committed SVG diagram — flowchart, swimlane, architecture graph, or data-flow — for a README, doc, or PR description. Opt-in: outputty never forces a diagram; reach for this only when a picture genuinely helps.
---

# diagram — committed SVGs for human surfaces

Produce a **self-contained SVG** that renders standalone on GitHub, in a README, and in the chat widget,
with no external CSS or host variables. Compose it from the copy-paste blocks in
[Components](#components-copy-paste); they carry the house style. This skill adds the layout and embedding
rules.

**Boundary — SVG is for humans.** Opt-in, and only for the README and PR bodies/comments. Markdown an
**agent** consumes (product docs, trails, briefs) gets **Mermaid**.

## House style (renders standalone)

- **Explicit hex `fill`/`stroke`** on every shape; font styling in an inline `<style>` block. No host CSS
  variables, no external classes.
- A light card background `<rect>`, for GitHub light and dark themes.
- `role="img"` with a `<title>` and `<desc>`.
- **Colour by category/layer, ≤3 coloured ramps + neutral gray**; a 1-line legend when colour encodes
  meaning. **Sentence case** labels.
- `viewBox="0 0 680 H"` for a simple top-down flow; keep content within `x=40..640` and trim height to the
  last element + ~20px. Widen for a wide swimlane.

## Shapes — mandatory in every flow diagram

The shape *is* the semantics:

- **Process / stage** = rounded rect (`rx≈7`).
- **Decision = diamond** (`<polygon>`), **always** — every `if`/`switch`/`case`, gate that stops or skips,
  or yes/no fork. **Never a rounded rect, never a bare edge label.** Chip every outgoing edge with its
  branch condition.
- **Start / stop / terminal** = terminator pill (`rx≈16`). A "gate off → stop" is a terminator off the
  diamond's negative edge.

Keep the diamond's question ≤2 short lines centred; push detail to edge chips or a caption.

## Sections — the band standard (use it EVERYWHERE)

Every section of a flow is a **band**:

- a **far-left label** (`class="band"`, `x=24`) naming it — `SPEC · GATED (you)`, `BUILD · RUN LAYER`,
  `BUILD · MASTER QA`; and
- a **full-width rule** just under it (`x1=24 … x2=<viewBoxW−24>`).

Nodes sit below the rule, centred on the flow column, until the next band. A top-level phase and a
sub-stage are the **same shape** — one band each; show grouping in the *name* (`BUILD · LAUNCH`,
`BUILD · LOOP`, `BUILD · MASTER QA`, `BUILD · MERGE`). Accent the rule for a hands-off band, keep it neutral
for an interactive one — see the [section-band component](#components-copy-paste). **Never invent a second
section style** — no indented mini-labels, no boxed sub-headers.

### Loops across sections

A loop's entry, body, exit conditional, and any post-loop check are **distinct bands**. Route the
**loop-back as an arrow between bands**: from the exit diamond (`more? / last?`) up to the band it
re-enters. A **memory loop** is a bottom layer the review stage writes and the next run reads, drawn as one
straight offset line. The loop-back and memory-loop components below are the copy-paste form.

## Default workflow

1. **Build** the SVG (named after the subject).
2. **Validate the XML first** — a malformed SVG silently fails to render on GitHub. Use a real parser:
   `python3 -c "import xml.dom.minidom as m; m.parse('f.svg'); print('ok')"`.
3. **Check text fits its box** (see Spacing). Overflow is the #1 defect.
4. **Embed** (see Embedding) and re-validate.

## Swimlanes

A swimlane is a **layers × stages matrix**: horizontal **layers** (rows) crossed by vertical **stages**
(columns). Flow reads **down a stage column, then right**. Four rules:

- **Layers (rows) = where output is produced or the thing acted on — not where the code runs.** If work
  happens in a worker but the result appears on an interface, place it in the interface layer. Stack related
  layers.
- **Stages (columns) = phases / time**, separated by labelled vertical lines, names along the top.
- **Orthogonal connectors only — no diagonals.** One straight segment between aligned boxes. **Avoid
  bent-arrow clusters.** Route a loop as one straight offset line.
- **Show distinct levels.** When nested, give each level its own layers: **solid border = one type, dashed =
  the other**; **colour family = the category**. Group and label the levels. Don't collapse a nested level
  into its parent.

**Stage columns are the one exception to the band standard**: mark them with labelled vertical dividers, not
left-labelled horizontal rules. The [swimlane component](#components-copy-paste) below is the copy-paste
form.

## Spacing & padding (do not squish)

- **Gutters & alignment:** a clear band between layer rows, a clear gutter between stage columns; never butt
  them edge-to-edge. Snap every box to its stage column `x`.
- **Box padding:** a box must be **wider than its text**. Estimate width ≈ `chars × 0.6 × font-px` (sans) /
  `× 0.62` (mono); leave ≥10px each side. If it overflows: widen, drop the font a step, or wrap to multiple
  `<text>` lines.
- **Pills:** reduce `rx` (≈16, not 20+); widen before rounding.
- **Vertical rhythm:** ~100–120px between row centres.
- **Edge labels:** `Yes`/`No` in a **small white chip** (`rect fill=#FFF` rx≈5) on the connector.
- **Legend:** ≥20px above and below it; don't hug the last lane or card edge.

## Embedding

- **README / any `.md` file view:** a relative path renders — `![alt](path/to/f.svg)`.
- **PR / issue descriptions:** relative paths do **not** render. Use the same-origin
  `github.com/<owner>/<repo>/raw/<branch>/` form (works on private repos for logged-in members):

  ```markdown
  ![alt](https://github.com/<owner>/<repo>/raw/<branch>/path/to/f.svg)

  > source: [`path/to/f.svg`](https://github.com/<owner>/<repo>/blob/<branch>/path/to/f.svg)
  ```

  Push the file to `<branch>` first, or the URL 404s. Edit the body with `gh pr edit <n> --body-file`
  (assert the old anchor is present before replacing).

## Gotchas

- `raw.githubusercontent.com` needs a token on a private repo → 404 / `text/plain` when unauth; the
  `github.com/<owner>/<repo>/raw/<branch>` route avoids that.
- GitHub serves `.svg` from raw as `text/plain` and **strips inline `<svg>` and `data:` URIs** from markdown
  bodies — the `raw/<branch>` link is the only form that renders.
- Escape `>` and `&` in SVG text as `&gt;` / `&amp;`. Avoid exotic glyphs — draw legend shapes as tiny
  `<polygon>`/`<rect>`.

## Components (copy-paste)

Compose these components — one `<g>` per section, each section a *band* plus its nodes. Put `<defs>` +
`<style>` once at the top; reuse the rest.

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
  .stage{font-size:14px;font-weight:700;fill:#3A3A37;text-anchor:middle} /* swimlane stage */
  .lvl {font-size:11px;font-weight:700;fill:#5F5E5A;text-anchor:middle}  /* level bracket  */
  .edge{fill:none;stroke:#888780;stroke-width:1.6}
  .dash{stroke-dasharray:5 4}
  .nbox{fill:#F3F2EF;stroke:#C9C7C0;stroke-width:1.3} /* interactive step   */
  .wfc {fill:#EEEDFE;stroke:#6B5BD6;stroke-width:1.6} /* hands-off workflow */
  .dia {fill:#FFFFFF;stroke:#6B5BD6;stroke-width:1.5} /* decision           */
  .stop{fill:#FBEBE9;stroke:#B0413E;stroke-width:1.6} /* stop / escalate    */
</style>
```

**Section band** (accent rule for a workflow band, neutral `#E5E3DC` for an interactive one):

```xml
<text class="band" x="24" y="Y">BUILD · RUN LAYER</text>
<line x1="24" y1="Yr" x2="836" y2="Yr" stroke="#6B5BD6" stroke-opacity="0.45" stroke-width="1"/>
```

**Process box** (`nbox`, interactive) / **workflow box** (`wfc`, hands-off) — same shape, swap class:

```xml
<rect class="nbox" x="170" y="Y" width="300" height="50" rx="8"/>
<text class="th" x="320" y="Y" text-anchor="middle">Run layer</text>
<text class="ts" x="320" y="Y" text-anchor="middle">build once → QA reviews + fixes → commit</text>
```

**Decision diamond** — chip each outgoing edge:

```xml
<polygon class="dia" points="320,T 372,C 320,B 268,C"/>  <!-- T=top y, C=centre y, B=bottom y -->
<text class="t" x="320" y="C" text-anchor="middle">Last</text>
<text class="t" x="320" y="C" text-anchor="middle">layer?</text>
```

**Terminator / stop pill**:

```xml
<rect class="stop" x="X" y="Y" width="250" height="40" rx="18"/>
<text class="th" x="X" y="Y" text-anchor="middle">Escalate → you</text>
```

**Edge chip** (`yes`/`no`/`drained`):

```xml
<rect x="Cx" y="Cy" width="54" height="16" rx="5" fill="#FFFFFF" stroke="#E5E3DC"/>
<text class="chip" x="Cx" y="Cy" text-anchor="middle" fill="#0F6E56">yes</text>
```

**Connector** (straight) and **loop-back** (exit conditional → margin → up → into the re-entered band's
feed arrow):

```xml
<line x1="320" y1="Y1" x2="320" y2="Y2" stroke="#888780" stroke-width="1.3" marker-end="url(#arrow)"/>
<path d="M268,DY L150,DY L150,TY L320,TY" fill="none" stroke="#6B5BD6" stroke-width="1.5"
  marker-end="url(#arrowp)"/>
```

**Swimlane frame**: stage columns, nested levels, memory loop. Layer bands tinted by level; a dashed border
marks the second level; every connector is one orthogonal segment.

```xml
<!-- layer bands: same tint per level, one <rect> per layer row -->
<rect x="150" y="275" width="1300" height="190" fill="#EEF7F3"/>   <!-- level 1 · orchestrator -->
<rect x="150" y="465" width="1300" height="190" fill="#F3F1FC"/>   <!-- level 2 · worker       -->
<text class="lvl" x="1502" y="370" transform="rotate(-90 1502 370)">level 1 · orchestrator</text>
<line x1="150" y1="370" x2="1450" y2="370" stroke="#E5E3DC" stroke-width="1" stroke-dasharray="4 4"/>

<!-- stage columns: a dashed vertical divider per boundary, the stage name along the top -->
<line x1="430" y1="85" x2="430" y2="750" stroke="#A9A79F" stroke-width="1.6" stroke-dasharray="3 4"/>
<text class="stage" x="290" y="74">1 · input</text>
<text class="stage" x="630" y="74">2 · processing loop</text>

<!-- nested level: dashed border = activity, solid = workflow, same colour family -->
<style>.act rect, .act polygon { stroke-dasharray:5 4 }</style>

<!-- orthogonal connector: down the column, then one horizontal hop to the next stage -->
<path class="edge" d="M630,297 L630,132 L913,132" marker-end="url(#arrow)"/>

<!-- memory loop: one straight line in the bottom layer, chipped -->
<path class="edge dash" d="M1250,702 L724,702" marker-end="url(#arrow)"/>
<rect x="918" y="692" width="170" height="19" rx="5" fill="#FFFFFF" stroke="#E5E3DC"/>
<text class="chip" x="1003" y="705" fill="#5F5E5A">enriches next run</text>
```

Wire them into `<g id="section-…">` groups, one per band. There is no reference diagram to copy.
