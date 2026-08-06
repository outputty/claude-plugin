# Claim: A test can pass while proving nothing

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

A permissive regex assertion was satisfied by a pre-existing error path — the test stayed green with the new code deleted. Basis for QA's exercises-the-contract check.

## How it was validated

Observed live in a laygo build; reproduced by deleting the new code and re-running the test.

## How to revalidate

The check is behavioural; revalidate by spot-deleting new code behind a green test.
