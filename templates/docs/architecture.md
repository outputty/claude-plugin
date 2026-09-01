# Architecture

The philosophy of this program: the stack it runs on, how its components connect, the patterns and principles every change follows, and the end-to-end pipeline every ticket and PR is written against. Implementation depth lives here, never in `product.md`; a truly low-level detail belongs in a docstring or a rule.

- `/plan` and `/build` read it whole.
- `/plan` changes it when a decision settles, marked `pending #<n>`; the docs layer that delivers it marks the entry `done`.
- `init` drafts it from the code's entry points and boundaries and settles every section with the user.

## The stack

<!-- One line per layer, top to bottom: what runs, on what, and what it talks to. From the manifests and the entry points, not from memory. -->

## How the components connect

<!-- A tree or a flow of the real components by their real names: who calls whom, where data enters and leaves, what a request passes through. Under 25 lines. Then one paragraph per boundary: what crosses it and in which shape. -->

```text
<components>
```

## Interfaces and overrides

<!-- How a public interface is structured, so a new one matches it; where a caller can override a default and where it cannot; what a component may know about its neighbours and what it may not. Cite the interface that sets the pattern. -->

## Principles

<!-- How a change is decided and proven. One line each; the story behind one lives in git log. Keep the five below; add the project's own from its existing docs and its corrections. -->

1. **Solve it one level up.** The place a symptom shows is the first place to look, never the last. Before fixing where it hurts, ask what the level above would need to change so the failure cannot be written; spike both and compare.
2. **A spike decides, not an argument.** Two shapes that argument cannot separate are both built thin, judged on one observable named beforehand, and the loser is deleted.
3. **The user picks between priced options.** Every option carries what it moves and what it breaks; a breaking change is priced like any other.
4. **A change is valid when its Done when cases run green and the program still runs end to end.** Every PR pastes the real output of the pipeline below.
5. **Build on what exists.** A near-duplicate of something already here is a defect; extend or unify instead.
6. <the project's own principles, one line each>

## The pipeline, end to end

<!-- What every ticket and PR is written towards: the canonical program, its input, and its REAL output from a run. Copied verbatim into a ticket's Done when case 1 and a PR's What this looks like. One program, one data set, reused everywhere. -->

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

<!-- One line per fact about a dependency or the platform that shaped a decision above, with the probe that re-verifies it. -->

- **<constraint>** - <what it forbids or forces>. Probe: `<command or doc page>`.
