# Architecture

<!-- A paragraph states the rule; a diagram or a snippet shows it. A subsystem whose detail outgrows its section moves to `.claude/architecture/<part>.md`, linked here. -->

## The stack

<!-- A labelled box diagram, top to bottom: what runs, on what, and what it talks to. -->

## How the components connect

<!-- A call-stack graph of the real components by their real names, under 25 lines. Then one paragraph per boundary: what crosses it and in which shape. -->

```text
<components>
```

## Interfaces and overrides

<!-- How a public interface is shaped, so a new one matches it; where a caller can override a default and where it cannot. Cite the interface that sets the pattern. -->

## Principles

<!-- One line each. -->

1. **Solve it one level up.** Spike the place in hand and the level above it, then compare.
2. **A spike decides.** Build both shapes thin, judge on one observable named beforehand, delete the loser.
3. **The user picks between priced options.** A breaking change is priced like any other.
4. **A change is valid when its Implementation-criteria cases run green and the pipeline below still runs.**
5. <the project's own principles>

## The pipeline, end to end

<!-- The canonical program every ticket and PR is written towards, copied into a ticket's What should happen and a PR's What this looks like. One program, one data set. -->

```lang
<the top-level call, real call shape>
```

Input:

```json
<real values>
```

Output:

```json
<real output from a run>
```

## Constraints in dependencies

<!-- One line per fact about a dependency that shaped a decision above, with the probe that re-verifies it. -->

- **<constraint>** - <what it forbids or forces>. Probe: `<command or doc page>`.
