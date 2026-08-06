# Claim: Subagents cannot share the orchestrator's task ledger

**Status:** valid · **Validated:** 2026-08-06 · **Scope:** laygo (consumer project) unless stated otherwise

## Statement

TaskCreate/TaskGet/TaskList/TaskUpdate/TaskOutput are withheld from subagents (a subagent reports none of them); TodoWrite is NOT stripped. AskUserQuestion is stripped from every subagent even when its charter lists it. Basis for inline task lists in briefs and HITL resolution before dispatch.

## How it was validated

Verified by running: a subagent asked to enumerate its tools.

## How to revalidate

Re-run the enumeration after a Claude Code major version bump.
