---
name: diagram
description: Produce a committed SVG diagram - flowchart, swimlane, architecture graph, or data-flow - for a README, or for a PR or issue body. Opt-in: outputty never forces a diagram; reach for this only when a picture genuinely helps.
---

# diagram - committed SVGs for READMEs and PR bodies

Produce a **self-contained SVG** that renders standalone on GitHub, in a README, and in the chat widget.
Use no external CSS and no host variables. Compose the SVG from the copy-paste blocks in
[Components](#components-copy-paste), which carry the house style. This skill adds the layout and embedding
rules.

## Boundary - where an SVG may land

A committed SVG lands in exactly two places: the README, and a PR or issue body or comment. Every other
Markdown surface gets inline Mermaid instead. The earned test applies to both rows: a picture that is not
earned is drawn in neither format.

| Surface | Format |
| --- | --- |
| `README.md`, and a PR or issue body or comment | committed SVG, produced by `diagram` |
| Every other Markdown file, `docs/**` and `.claude/**` included | inline Mermaid, in the file that owns it |

## House style (renders standalone)

- **Fills and strokes:** explicit hex `fill` and `stroke` on every shape. Put font styling in an inline
  `<style>` block. No host CSS variables, no external classes.
- **Card background:** a light `<rect>` behind everything, for GitHub light and dark themes.
- **Accessibility:** `role="img"` with a `<title>` and a `<desc>`.
- **Palette:** colour by category or layer, with ≤3 coloured ramps plus neutral gray. Add a one-line legend
  when colour encodes meaning. Write labels in **sentence case**.
- **Canvas:** `viewBox="0 0 680 H"` for a simple top-down flow, with the flow column centred at `x=340`.
  Keep content within `x=40..640`. Trim the height to the last element plus about 20px. Widen the canvas
  for a wide swimlane.

## Shapes - mandatory in every flow diagram

The shape *is* the semantics:

| Meaning | Shape | Where it applies |
| --- | --- | --- |
| Process or stage | rounded rect (`rx≈7`) | one stage per box |
| Decision | diamond (`<polygon>`), always | every `if`, every `switch` or `case`, every gate that stops or skips, every yes-or-no fork |
| Start, stop or terminal | terminator pill (`rx≈16`) | a gate that stops the flow is a terminator off the diamond's negative edge |

**Never draw a decision as a rounded rect, and never as a bare edge label.** Chip every outgoing edge with
its branch condition. Keep the diamond's question to ≤2 short lines, centred. Push the detail out to edge
chips or to a caption.

## Sections - the band standard

Every section of a flow is a **band**. A band is two things:

- a **far-left label** (`class="band"`, `x=24`) that names it, such as `SPEC · GATED (you)`, `BUILD · RUN
  LAYER`, or `BUILD · MASTER QA`; and
- a **full-width rule** just under it (`x1=24 … x2=<viewBoxW−24>`, so `656` on the default 680 canvas).

Nodes sit below the rule, centred on the flow column, until the next band. A top-level phase and a
sub-stage are the same shape, one band each. Show the grouping in the *name* (`BUILD · LAUNCH`, `BUILD ·
LOOP`, `BUILD · MASTER QA`, `BUILD · MERGE`). Accent the rule for a hands-off band, and keep it neutral for
an interactive one. **Never invent a second section style: no indented mini-labels, no boxed sub-headers.**

### Loops across sections

A loop's entry, body, exit conditional, and any post-loop check are **distinct bands**. Route the loop-back
as an arrow between bands. It runs from the exit diamond (`more?` or `last?`) up to the band that it
re-enters. A **memory loop** is a bottom layer that the review stage writes and the next run reads. Draw it
as one straight offset line.

## Default workflow

1. **Build** the SVG, named after its subject.
2. **Validate the XML first.** A malformed SVG fails to render on GitHub with no error. Use a real parser:
   `python3 -c "import xml.dom.minidom as m; m.parse('f.svg'); print('ok')"`.
3. **Check that text fits its box** (see Spacing). Overflow is the #1 defect.
4. **Embed** (see Embedding), then re-validate.

## Swimlanes

A swimlane is a **layers × stages matrix**: horizontal layers (rows) crossed by vertical stages (columns).
Flow reads down a stage column, then right. Four rules:

- **Place a layer (row) by where output appears, or by the thing that is acted on.** Never place it by
  where the code runs. If work happens in a worker but the result appears on an interface, place it in the
  interface layer. Stack related layers.
- **Separate stages (columns) by phase in time.** Divide them with labelled vertical lines, and put the
  names along the top.
- **Draw orthogonal connectors only, no diagonals.** Use one straight segment between aligned boxes. Avoid
  bent-arrow clusters. Route a loop as one straight offset line.
- **Show distinct levels.** When nested, give each level its own layers: a solid border marks one type, and
  a dashed border marks the other. Let the colour family mark the category. Group and label the levels.
  Never collapse a nested level into its parent.

**Stage columns are the one exception to the band standard.** Mark them with labelled vertical dividers,
never with left-labelled horizontal rules.

## Spacing and padding (do not squish)

- **Gutters and alignment:** leave a clear band between layer rows, and a clear gutter between stage
  columns. Never butt them edge-to-edge. Snap every box to its stage column `x`.
- **Box padding:** a box must be wider than its text. Estimate the width as `chars × 0.6 × font-px` for
  sans, or `chars × 0.62 × font-px` for mono. Leave ≥10px each side. If the text overflows: widen the box,
  drop the font a step, or wrap to multiple `<text>` lines.
- **Pills:** reduce `rx` to about 16, never 20 or more. Widen before rounding.
- **Vertical rhythm:** leave about 100 to 120px between row centres.
- **Edge labels:** put `Yes` or `No` in a small white chip (`rect fill=#FFF` rx≈5) on the connector.
- **Legend:** leave ≥20px above and below it. Never hug the last lane or the card edge.

## Embedding

- **README, or any `.md` file view:** a relative path renders, so use `![alt](path/to/f.svg)`.
- **PR or issue descriptions:** relative paths do **not** render. Use the same-origin
  `github.com/<owner>/<repo>/raw/<branch>/` form, which works on private repos for logged-in members:

  ```markdown
  ![alt](https://github.com/<owner>/<repo>/raw/<branch>/path/to/f.svg)

  > source: [`path/to/f.svg`](https://github.com/<owner>/<repo>/blob/<branch>/path/to/f.svg)
  ```

  Push the file to `<branch>` first, or the URL 404s. Then edit the body as a read-modify-write:

  1. Read the body that is there now: `gh pr view <n> --json body -q .body`.
  2. Find the anchor that you expect, and splice the image in beside it.
  3. Write the whole body back: `gh pr edit <n> --body-file <f>`.

  ⚠ `--body-file` replaces the entire body, so never write a body that you did not read. A missing anchor
  is a stop, never a replace: report it, and leave the body as it is.

## Gotchas

- On a private repo `raw.githubusercontent.com` needs a token, and returns 404 or `text/plain` when
  unauthenticated. The `github.com/<owner>/<repo>/raw/<branch>` route avoids that.
- GitHub serves `.svg` from raw as `text/plain`, and it strips inline `<svg>` and `data:` URIs from
  markdown bodies. The `raw/<branch>` link is the only form that renders.
- Escape `>` and `&` in SVG text as `&gt;` and `&amp;`. Avoid exotic glyphs, and draw legend shapes as tiny
  `<polygon>` or `<rect>` elements.

## Components (copy-paste)

Compose these components: one `<g>` per section, each section a band plus its nodes. Put `<defs>` and
`<style>` once at the top, and reuse the rest.

**Placeholders.** Every `{expr}` is arithmetic off a named anchor. `Y` is the band's own top edge, and the
flow column centre is `x=340` on the default 680 canvas. A `<rect>` `y` is its **top** edge, and a `<text>`
`y` is its **baseline**. Never give the two the same number.

**Defs and palette** (once):

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
  .stop{fill:#FBEBE9;stroke:#B0413E;stroke-width:1.6} /* stop or escalate   */
</style>
```

**Section band** (accent rule for a workflow band, neutral `#E5E3DC` for an interactive one). The label
baseline sits at `{Y}`, and the rule 8px under it:

```xml
<text class="band" x="24" y="{Y}">BUILD · RUN LAYER</text>
<line x1="24" y1="{Y+8}" x2="656" y2="{Y+8}" stroke="#6B5BD6" stroke-opacity="0.45" stroke-width="1"/>
```

**Process box** (`nbox`, interactive) and **workflow box** (`wfc`, hands-off), the same shape with the
class swapped. The box spans `{Y}` to `{Y+50}`, so the two baselines sit inside it:

```xml
<rect class="nbox" x="190" y="{Y}" width="300" height="50" rx="8"/>
<text class="th" x="340" y="{Y+21}" text-anchor="middle">Run layer</text>
<text class="ts" x="340" y="{Y+37}" text-anchor="middle">build once → QA reviews + fixes → commit</text>
```

**Decision diamond**, chip each outgoing edge. Top `{Y}`, centre `{Y+34}`, bottom `{Y+68}`, half-width 52:

```xml
<polygon class="dia" points="340,{Y} 392,{Y+34} 340,{Y+68} 288,{Y+34}"/>
<text class="t" x="340" y="{Y+31}" text-anchor="middle">Last</text>
<text class="t" x="340" y="{Y+45}" text-anchor="middle">layer?</text>
```

**Terminator or stop pill**. The pill spans `{Y}` to `{Y+40}`, and `x=215` centres its 250 width on 340:

```xml
<rect class="stop" x="215" y="{Y}" width="250" height="40" rx="18"/>
<text class="th" x="340" y="{Y+25}" text-anchor="middle">Escalate → you</text>
```

**Edge chip** (`yes`, `no`, `drained`), centred at `{Cx},{Cy}` on the connector it labels:

```xml
<rect x="{Cx-27}" y="{Cy-8}" width="54" height="16" rx="5" fill="#FFFFFF" stroke="#E5E3DC"/>
<text class="chip" x="{Cx}" y="{Cy+3.5}" text-anchor="middle" fill="#0F6E56">yes</text>
```

**Connector** (straight) and **loop-back** (out of the exit conditional, to the margin, up, then into the
re-entered band's feed arrow). `{DY}` is the exit diamond's centre y, and `{TY}` the feed y of the band
that it re-enters:

```xml
<line x1="340" y1="{Y1}" x2="340" y2="{Y2}" stroke="#888780" stroke-width="1.3" marker-end="url(#arrow)"/>
<path d="M288,{DY} L150,{DY} L150,{TY} L340,{TY}" fill="none" stroke="#6B5BD6" stroke-width="1.5"
  marker-end="url(#arrowp)"/>
```

**Swimlane frame**: stage columns, nested levels, memory loop. Layer bands are tinted by level, a dashed
border marks the second level, and every connector is one orthogonal segment. These numbers are literal,
not placeholders: a swimlane needs the widened canvas, so its coordinates are its own.

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
