# Swimlane diagrams — layout rules

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
