---
name: diagram
description: "Produce a committed SVG diagram - flowchart, swimlane, architecture graph, or data-flow - for a README, or for a PR or issue body. Use when a reader needs the shape of a flow that prose cannot carry. Opt-in: reach for it only when a picture genuinely helps."
---

# diagram - committed SVGs for READMEs and PR bodies

Input: the subject to draw, and the file or body that the picture lands in.

Output: one **self-contained SVG**, committed, that renders standalone on GitHub, in a README, and in the
chat widget. Use no external CSS and no host variables. Compose it from the copy-paste blocks in
`references/components.md`, which carry the house style.

## Where a picture belongs

**Earned test.** A picture is earned when it encodes relationships that prose serialises poorly. Four
shapes qualify: an architecture of three or more components, data or control flow across a boundary, a
state machine, and a decision tree. Linear steps get a numbered list instead. A picture that is not earned is drawn in no
format at all.

An earned picture takes its format from the surface it lands on:

1. **`README.md`, and a PR or issue body or comment** - a committed SVG. One exception: a task issue's
   `brief` takes inline Mermaid, because an agent reads it.
2. **Every other Markdown file** - inline Mermaid, in the file that owns it, `docs/**` and `.claude/**`
   included.

## Default workflow

**The component library lives in
`${CLAUDE_PLUGIN_ROOT}/skills/diagram/references/components.md`.** Open it when you start drawing.

1. **Build** the SVG, named after its subject.
2. **Validate the XML first.** A malformed SVG fails to render on GitHub with no error. Use a real parser:
   `python3 -c "import xml.dom.minidom as m; m.parse('f.svg'); print('ok')"`.
3. **Check that text fits its box** (see Spacing). Overflow is the #1 defect.
4. **Embed** (see Embedding), then re-validate.

## House style (renders standalone)

- **Fills and strokes:** explicit hex `fill` and `stroke` on every shape. Put font styling in an inline
  `<style>` block. No host CSS variables, no external classes.
- **Card background:** a light `<rect>` behind everything, for GitHub light and dark themes.
- **Accessibility:** `role="img"` with a `<title>` and a `<desc>`.
- **Palette:** colour by category or layer, with ≤3 coloured ramps plus neutral gray. Add a one-line legend
  when colour encodes meaning. Write labels in sentence case.
- **Canvas:** `viewBox="0 0 680 H"` for a simple top-down flow, with the flow column centred at `x=340`.
  Keep content within `x=40..640`. Trim the height to the last element plus about 20px. Widen the canvas
  for a wide swimlane.

## Shapes - mandatory in every flow diagram

The shape *is* the semantics:

1. **Process or stage** - a rounded rect (`rx≈7`), one stage per box.
2. **Decision** - a diamond (`<polygon>`), for every `if`, every `switch` or `case`, every gate that stops
   or skips, and every yes-or-no fork.
3. **Start, stop or terminal** - a terminator pill (`rx≈16`). A gate that stops the flow is a terminator
   off the diamond's negative edge.

**Draw every decision as a diamond.** Chip each outgoing edge with its branch condition. Keep the diamond's
question to ≤2 short lines, centred. Push the detail out to edge
chips or to a caption.

## Sections - the band standard

Every section of a flow is a **band**. A band is two things:

- a **far-left label** (`class="band"`, `x=24`) that names it, such as `SPEC · GATED (you)`, `BUILD · RUN
  LAYER`, or `BUILD · MASTER QA`; and
- a **full-width rule** just under it (`x1=24 … x2=<viewBoxW−24>`, so `656` on the default 680 canvas).

Nodes sit below the rule, centred on the flow column, until the next band. A top-level phase and a
sub-stage are the same shape, one band each. Show the grouping in the *name* (`BUILD · LAUNCH`, `BUILD ·
LOOP`). Accent the rule for a hands-off band, and keep it neutral for an interactive one. **A label plus a
rule is the whole section style**, at every depth.

### Loops across sections

A loop's entry, body, exit conditional, and any post-loop check are **distinct bands**. Route every
loop-back as one straight offset line. It leaves the exit diamond (`more?` or `last?`), runs to the
margin, then goes up into the band that it re-enters. A **memory loop** is a bottom layer that the review stage writes and the
next run reads.

## Swimlanes

A swimlane is a **layers × stages matrix**: horizontal layers (rows) crossed by vertical stages (columns).
Flow reads down a stage column, then right.

- **Place a layer (row) by where output appears, or by the thing that is acted on.** Work that happens in
  a worker but appears on an interface goes in the interface layer. Stack related layers.
- **Separate stages (columns) by phase in time.** Divide them with labelled vertical lines, and put the
  names along the top.
- **Draw orthogonal connectors only.** Use one straight segment between aligned boxes, and align the boxes
  so one segment reaches.
- **Show distinct levels.** When nested, give each level its own layers: a solid border marks one type, and
  a dashed border marks the other. Let the colour family mark the category. Group and label the levels,
  each nested level drawn in its own.

**Stage columns are the one exception to the band standard.** Mark them with labelled vertical dividers.

## Spacing and padding

- **Gutters and alignment:** leave a clear band between layer rows, and a clear gutter between stage
  columns. Snap every box to its stage column `x`.
- **Box padding:** a box must be wider than its text. Estimate the width as `chars × 0.6 × font-px` for
  sans, or `chars × 0.62 × font-px` for mono. Leave ≥10px each side. If the text overflows: widen the box,
  drop the font a step, or wrap to multiple `<text>` lines.
- **Pills:** keep `rx` at about 16, and widen the pill before rounding it further.
- **Vertical rhythm:** leave about 100 to 120px between row centres.
- **Edge labels:** put `Yes` or `No` in a small white chip (`rect fill=#FFF` rx≈5) on the connector.
- **Legend:** leave ≥20px above and below it, clear of the last lane and the card edge.

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

  ⚠ `--body-file` replaces the entire body, so write back only a body you read in step 1. A missing anchor
  is a stop: report it, and leave the body as it is.

## Gotchas

- **Link the committed file by path** - `raw.githubusercontent.com` needs a token on a private repo, and
  returns 404 or `text/plain` when unauthenticated.
- **Reference the `.svg` as an image in a markdown body** - GitHub strips an inline `<svg>` and a `data:`
  URI.
- **Escape `>` and `&` in SVG text** as `&gt;` and `&amp;`. Keep to common glyphs, and draw legend shapes
  as tiny `<polygon>` or `<rect>` elements.
