# Architecture

## The stack

<!-- What runs, on what, and what it talks to. -->

## How the components connect

```text
<call-stack graph of the base pipeline, real names>
```

## Interfaces and overrides

<!-- How a public interface is shaped, so a new one matches it, and where a caller can override a default. -->

## Principles

1. **Solve it one level up.** Spike the place in hand and the level above it, then compare.
2. **A spike decides.** Build both shapes thin, judge on one observable named beforehand, delete the loser.
3. **The user picks between priced options.** A breaking change is priced like any other.
4. <the project's own principles, one line each>

## Constraints in dependencies

- **<constraint>** - <what it forbids or forces>. Probe: `<command or doc page>`.
