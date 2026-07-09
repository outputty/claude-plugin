<!--
PR description format — enforced by the outputty-review skill.
Keep it human-readable and as untechnical as possible. Delete the guidance comments
(and any block that doesn't apply) as you fill this in.
-->

## Summary

<!-- One plain-language bullet per notable change — a non-engineer should grasp it.
     The sections below MUST appear in the SAME order as these bullets. -->

-

<!-- ────────────────────────────────────────────────────────────────────────
Then one section per summary bullet, in the same order. Copy the block below per
bullet and fill it in (drop the parts that don't apply):

## <change — same wording as its summary bullet>

<Why — the problem / motivation this solves, not the mechanics.>

How to verify — <the fastest way a reviewer confirms it works: the exact request to
send, the file/response to inspect, or the project's targeted test command.>

Output — before / after — REQUIRED whenever the change alters output (a record, a
file, or the API response). Show both as JSON:

    ```json
    { "before": … }
    ```
    ```json
    { "after": … }
    ```

How it works — ONLY when the flow actually changes. A condensed Mermaid flowchart of
the happy path: the step immediately before and immediately after the change in full,
everything else collapsed to one node each, ≤5 nodes, and the new/changed step
highlighted. A bugfix / format-swap that doesn't change the flow gets no diagram.
──────────────────────────────────────────────────────────────────────── -->

## Keep in mind

<!-- Future work; and any gotchas found — how each was worked around, or, if it was
     never solved, noted so it isn't re-attempted. -->
