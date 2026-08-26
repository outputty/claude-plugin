# SVG components - copy, paste, fill

Open this once you have decided a picture belongs and know its shape. `SKILL.md` holds that
decision, the house style and the embedding step.

## Components (copy-paste)

Compose these components into one `<g id="section-…">` per band, each a band plus its nodes. Put `<defs>`
and `<style>` once at the top, and reuse the rest. There is no reference diagram to copy.

**Placeholders.** Every `{expr}` is arithmetic off a named anchor. `Y` is the band's own top edge, and the
flow column centre is `x=340` on the default 680 canvas. A `<rect>` `y` is its **top** edge, and a `<text>`
`y` is its **baseline**, so the two carry different numbers.

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
