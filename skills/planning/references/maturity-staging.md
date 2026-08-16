# Maturity staging — optional, for large or uncertain deliverables only

A big or unfamiliar deliverable **matures in visible stages** instead of landing in one commit. Express
that as a `deps` chain over the **same scope**, tagging each task with a `stage`.

- **prototype** - the thinnest end-to-end slice that runs, plus the examples and trade-off note that show
  the shape. Divergent option-exploration belongs in SPEC, as cheap talk or as a discarded spike.
- **build** - harden that slice to the `contract`, and drop what didn't survive the prototype.
- **sweep** - align to existing patterns across the touched files, dedupe, and delete scaffolding.

The stages land in successive layers because each one `deps` on the last. The per-layer PR comment then
narrates the maturation. **Default to a single task**: small, well-understood work does all three in one
laziest diff. Staging is opt-in, per deliverable, and never a blanket pipeline. **Promote sweep to its
own task only when the cleanup is cross-layer.** `stage` is a **label only**, so ordering is still the
`deps` you author.
