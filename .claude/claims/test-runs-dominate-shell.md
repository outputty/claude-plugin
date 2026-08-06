# Claim: Cold test re-runs are the biggest time sink in a build

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

On a real build session, 183 of 615 shell calls were test runs, 46 of them full multi-package sweeps at ~10s per package. Basis for capturing a faster feedback path when the repo has one.

## How it was validated

Classification of Bash tool calls in the session transcript.

## How to revalidate

Re-classify a current build's shell calls; stale if test runs no longer dominate.
