---
name: <domain>
description: <the domain's traps, named by problem and tool, and when a session needs them, in the words a ticket would use. e.g. "DuckDB traps - transactions across connections, the appender, extension loading. Use when a ticket reads or writes DuckDB directly.">
---

# <domain>

<!--
A domain skill holds the traps of one domain that a strong model still gets wrong. Every line is one thing a session can act on without opening anything else.
State only what was verified: the error as printed, the option as spelled, the version it holds for.
A few hundred lines at most, never 500.
The description is third person, says what the skill holds and when to load it, and carries no angle-bracket tag.
A longer explanation goes under references/, named here directly; a reference file never links to another, and one over 100 lines opens with a `## Contents` list of its headings.
A bundled script is named here with its exact command and the install line for every tool it needs.
Generic to the domain: no reference to this repo's code or a current ticket.
A session edits this file only when the user asks.
-->

The <domain> traps a strong model still gets wrong, grouped by the problem, with the tool named where a line is about one.

## <a problem the domain causes>

- **<what goes wrong, or what to do>** (<tool>) - <how it shows, and the fix>.
