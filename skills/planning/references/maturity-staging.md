# Maturity staging — optional, for large or uncertain deliverables only

A big or unfamiliar deliverable **matures in visible stages** instead of one commit. Express it as a
`deps` chain over the **same scope**, tagging each task with a `stage`.

- **prototype** — the thinnest end-to-end slice that runs, plus the examples and trade-off note that show
  the shape. Divergent option-exploration belongs in SPEC, as cheap talk or a discarded spike.
- **build** — harden that slice to the `contract`; drop what didn't survive the prototype.
- **sweep** — align to existing patterns across the touched files, dedupe, delete scaffolding.

The stages land in successive layers because each `deps` on the last, and the per-layer PR comment
narrates the maturation. **Default to a single task**: small, well-understood work does all three in one
laziest diff. Staging is opt-in, per deliverable, never a blanket pipeline. **Promote sweep to its own
task only when the cleanup is cross-layer.** `stage` is a **label only** — ordering is still the `deps`
you author.
