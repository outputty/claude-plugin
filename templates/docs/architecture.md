# Architecture

The philosophy of this program: the stack it runs on, how its components connect, the principles every change follows, and the end-to-end pipeline every ticket and PR is written against. High level by design; a low-level detail belongs in a docstring or a rule. `/plan` and `/build` read it whole. `/plan` changes it when a decision settles, marked `pending #<n>`; the docs layer that delivers it marks the entry `done`.

## The stack

<one line per layer, top to bottom: what runs, on what, and what it talks to>

## How the components connect

```text
<the components as a tree or a flow: who calls whom, where data enters and leaves, what a request passes through>
```

<one paragraph per boundary: what crosses it and in which shape>

## Interfaces and overrides

<how a public interface is structured, so a new one matches; where a caller can override a default and where it cannot; what a component may know about its neighbours and what it may not>

## Principles

How a change is decided and proven. Each is one line; a story behind one lives in `git log`.

1. **Solve it one level up.** The place a symptom shows is the first place to look, never the last. Before fixing where it hurts, ask what the level above would need to change so the failure cannot be written; spike both and compare.
2. **A spike decides, not an argument.** Two shapes that argument cannot separate are both built thin, judged on one observable named beforehand, and the loser is deleted.
3. **The user picks between priced options.** Every option carries what it moves and what it breaks; a breaking change is priced like any other.
4. **A change is valid when its Done when cases run green and the program still runs end to end.** Every PR pastes the real output of the pipeline below.
5. **Build on what exists.** A near-duplicate of something already here is a defect; extend or unify instead.
6. <the project's own principles, one line each>

## The pipeline, end to end

What every ticket and PR is written towards: the canonical program, its input, and its real output. Copied verbatim into a ticket's Done when case 1 and a PR's **What this looks like**.

```lang
<the top-level call, simplified data, real call shape>
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

<one line per fact about a dependency or the platform that shaped a decision above, with the probe that re-verifies it>

- **<constraint>** - <what it forbids or forces>. Probe: `<command or doc page>`.
