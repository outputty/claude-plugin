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

A swimlane is a **layers × stages matrix**: horizontal **layers** (rows) crossed by vertical
**stages** (columns). Flow reads **down a stage column, then right to the next stage**.

- **Layers (rows) = where output is produced or the thing being acted on — not where the code runs.**
  Place each box in the layer of the *surface* that produces its output. If work happens in a worker
  but the result appears on an interface, it belongs in the interface layer — show the surface, not
  the mechanism. Stack related layers together.
- **Stages (columns) = phases / time**, separated by labelled vertical lines (e.g. input →
  processing → response → review), stage names along the top.
- **Align everything into vertical columns.** Within a stage, every box shares the column's `x` so the
  eye follows a straight vertical path, then one clean horizontal hop to the next stage. Misalignment
  is what forces diagonal or bent arrows.
- **Orthogonal connectors only — no diagonals.** Every edge is horizontal/vertical, ideally a single
  straight segment between aligned boxes. **Avoid bent-arrow clusters** (several L-shaped arrows
  meeting at a point read as a pinwheel). Route a loop as one straight offset line, not a hook.
- **Show distinct levels.** When the system nests (a top-level workflow that calls a lower one), give
  each level its own layers: **solid border = one type, dashed border = the other**; **colour family =
  the category**. Group and label the levels (`level 1` / `level 2`). Don't collapse a nested level
  into its parent.
- **Conditionals = diamonds**, in their owner's layer; branch edges carry white chips
  (`approve`/`reject`, `yes`/`no`); the reject/loop edge routes straight back to the stage it retries.
- **Feedback / memory loops are first-class** — one clean straight line (e.g. a bottom memory layer a
  review step writes to and the next run reads from), so cross-iteration learning is visible.

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

## Canonical fragments

```xml
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5"
  markerHeight="6.5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9"
  fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round"
  stroke-linejoin="round"/></marker></defs>

<!-- ≤3 category ramps + gray. Rename per diagram; keep the palette. -->
<style>
  .cat1 rect,.cat1 polygon{fill:#E6F1FB;stroke:#185FA5}  /* category 1 */
  .cat2 rect,.cat2 polygon{fill:#E1F5EE;stroke:#0F6E56}  /* category 2 */
  .cat3 rect,.cat3 polygon{fill:#EEEDFE;stroke:#534AB7}  /* category 3 */
  .gray rect,.gray polygon{fill:#F1EFE8;stroke:#5F5E5A}  /* external / neutral */
  .act  rect,.act  polygon{stroke-dasharray:5 4}         /* dashed variant vs solid */
</style>

<!-- process -->   <rect class="..." x="" y="" width="" height="" rx="8"/>
<!-- decision -->  <polygon class="..." points="cx,t rx,cy cx,b lx,cy"/>
<!-- terminator --> <rect class="..." x="" y="" width="" height="" rx="16"/>
<!-- branch chip --> <rect x="" y="" width="46" height="19" rx="5" fill="#FFFFFF" stroke="#E5E3DC"/>
```

## Worked examples

Two complete, self-contained reference SVGs ship in [`examples/`](examples/) — both render standalone.

- [`examples/layered-flow.svg`](examples/layered-flow.svg) — a **layered data-flow** grid
  (sources → ingest → per-unit transform → shared model → export → sink) in the 680-wide house format.
  Use for pipeline / medallion flows.
- [`examples/swimlane.svg`](examples/swimlane.svg) — a **layers × stages swimlane**: layers placed by
  *where output is produced*, four labelled stage columns, column-aligned orthogonal flow, a decision
  diamond with `approve`/`reject` chips, two levels shown via solid (workflow) vs dashed (activity)
  borders, and a memory layer a review step writes to and the next run reads. The model for any swimlane.
