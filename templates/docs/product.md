# Product

The product's truth, written as finished documentation: what it does and what it will do, as one seamless description. A reader gets a feel for the product from this file alone.

- No development context: no tickets, no lessons, no history, no pending markers. Built and aimed-for read the same; `roadmap.md` separates them.
- `/plan` writes a settled capability in; the docs layer rewrites a section its build changed; a decommission deletes its section in the same PR.
- Implementation lives in `architecture.md`; an example is pulled from `examples.md`, never duplicated.
- Read whole, first, every session; prose stays at product altitude, one section per capability.
- `init` drafts it from the README and the code and settles every section with the user.

## North Star

<!-- One paragraph. What this product is for, who it is for, and the one thing it must never become. A sentence true of a dozen other projects is cut. -->

## Functionality

<!-- One subsection per capability, built and aimed-for alike: what it does and how it behaves at the edges, in the user's terms, with its example reused from examples.md. -->

### <capability>

<what it does, in the user's terms>

```lang
<the call, from examples.md>
```

## Language

<!-- One canonical term per line: the term, a one-line definition, the synonyms it replaces. Only terms the code or the docs actually use; a term with no synonym to replace is not listed. -->

- **<term>** - <definition>. (replaces: <synonyms>)
