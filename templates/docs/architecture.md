# Architecture

How the program works and where its seams are. `/grill` and `fix-issue` read it whole; `/breakdown` adds the delta a parent will bring, marked `pending #<parent>`; the PR that delivers it marks the entry `done` and rewrites any seam the diff moved.

## The program

```text
<the canonical top-level call, with input and output as real values>
```

## How it runs

```text
main()
	<call stack graph: entry point first, one indent per call, annotations only where a call loops or leaves the process>
```

## Seams

<one per line: the boundary, its two sides, and the contract between them>

- **<seam>** - <side A> → <side B>: <contract>

## Feature index

<one entry per feature or knob; a constraint in a dependency is `kind: limitation` with the probe that re-verifies it>

- **<feature>** - <one line>. `<file>`. (pending #<parent> | done)
