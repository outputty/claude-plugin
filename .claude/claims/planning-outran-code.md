# Claim: Charting fog as tasks produces re-planning churn

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

In the stretch where unknowns were pre-sliced into tasks, laygo recorded 17 planning commits against 1 code commit, and re-planning churn rose from 9% to 23% of commits. Basis for the fog-of-war rule.

## How it was validated

git log classification of laygo commits (planning-doc-only vs code) over the affected date range.

## How to revalidate

Re-classify a recent cycle; stale if fogged planning shows the same churn.
