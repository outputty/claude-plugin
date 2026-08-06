# Claim: An orchestrator grinding lookups spends permanent context on dead ends

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

A live build session ran 65 grep/rg calls and 30 cat/sed file reads against 18 whole-file Reads, opening one 1,840-line file in three separate windows — all permanent in the orchestrator's context. Basis for the scout delegation rule.

## How it was validated

jq classification of tool calls in laygo session transcript 4dfc3901.

## How to revalidate

Re-classify a current session; stale if direct lookups no longer dominate.
