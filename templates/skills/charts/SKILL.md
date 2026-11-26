---
name: charts
description: Draws file trees, flowcharts and Gantt charts in a text fence for a reply. Use whenever the user asks to draw a tree, a flowchart or a Gantt chart, or to show a flow, a sequence, timing or a file structure as a picture.
---

# charts

## Charts

### Do

- Draw the chart in a `text` fence, under about 25 lines.
- Draw a flowchart for a flow's logic: ASCII, left to right, a label on each branch: [references/flowchart.txt](references/flowchart.txt)
- Draw a Gantt chart for one call's sequence: one row per step, the entry point first, a call under its caller's bar, a repeat as a second bar; width shows duration only when measured: [references/gantt.txt](references/gantt.txt)
- Draw a tree for files and structure, with real names.
- Mark the change `← changed`.

### Don't

- Don't draw a chart the user did not ask for.

## Glossary

- **Flowchart** - the logic of a flow, with a label on each branch.
- **Gantt chart** - one call's sequence, one row per step.
- **Tree** - files and structure, with real names.
