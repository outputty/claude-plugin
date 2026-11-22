---
name: tsup
description: tsup build traps and fixes. Use when building a package with tsup.
---

# tsup

## Do

- Set `splitting: true` when two entries share a class.
- Check a build by running the built entries, not `src`.
- Search built CJS for both quote styles: `["']ws["']`.
- Prove a package is absent from an entry: copy `dist` and `package.json` into a directory with no `node_modules`, run the entry, and control with an entry that must fail.
- Type a published parameter with `node:` type-only imports.
- Search a downstream resolution failure for the bare name of a `node:` import.

## Don't

- Don't use `Parameters<>` off an untyped optional package in a `.d.ts`.
- Don't rely on `skipLibCheck: true` to pass a consumer's strict check.

## Glossary

- **Entry** - a source file tsup builds into its own output file.
- **Splitting** - tsup's code splitting, which puts code two entries share in one chunk.
