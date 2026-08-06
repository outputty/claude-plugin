# Claim: Rules that never reach an agent do not fire

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

With protocol delivery gated to the main session, subagents made 3 LSP calls against 19,902 Bash calls across the measured period — the navigate-with-LSP rule existed but never reached the agents doing the navigating. Basis for charter preloads.

## How it was validated

Tool-call counts across laygo transcripts, split by main-session vs subagent turns.

## How to revalidate

Re-count after a build on >=0.36.0; the preloads should move the ratio.
