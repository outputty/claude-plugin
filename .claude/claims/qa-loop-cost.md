# Claim: A builder/QA round-trip loop rebuilds context it already had

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

Across 19 days of real builds, the builder/QA pair burned 21,104 API calls and 1,761M tokens of context, most of it re-deriving diagnoses QA already held. Basis for QA repairing in its own context instead of handing back.

## How it was validated

Per-request usage aggregation over laygo transcripts (dedupe by requestId), attributed to builder/QA dispatch windows.

## How to revalidate

Re-aggregate over a current build; stale if the one-pass shape shows similar re-derivation cost.
