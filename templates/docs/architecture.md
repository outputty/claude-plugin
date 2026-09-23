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

1. **A change is valid when its Implementation-criteria cases run green and the pipeline below still runs.**
2. <the project's own principles>

## The pipeline, end to end

<!-- The canonical program every ticket and PR is written towards, copied into a ticket's and a PR's Solution. One program, one data set. -->

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

## Parts

<!-- One line per `.claude/architecture/<part>.md`: the subsystem and when to open it. -->

- [`<part>`](architecture/<part>.md) - <what it covers>

## Constraints in dependencies

<!-- One line per fact about a dependency that shaped a decision above, with the probe that re-verifies it. -->

- **<constraint>** - <what it forbids or forces>. Probe: `<command or doc page>`.
