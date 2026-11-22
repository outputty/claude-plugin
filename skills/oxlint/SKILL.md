---
name: oxlint
description: oxlint config traps and fixes. Use when editing an oxlint config.
---

# oxlint

## Do

- Put an import boundary or a banned module in the linter's config, not in prose.
- Ban a Node builtin with both forms: [references/oxlint-node-group.json](references/oxlint-node-group.json)
- Use `import/no-nodejs-modules` with `{ allow: [...] }` to allow named builtins.
- Carve an exception with `excludeFiles` on one broad override.

## Don't

- Don't write `node:*` alone in a `no-restricted-imports` group.
- Don't carve an exception with two overrides on the same files.
- Don't reach for `no-restricted-syntax`.
- Don't rely on `no-extend-native` to catch `class X extends Function`.

## Glossary

- **Override** - an `overrides` entry that applies rules to a set of files.
- **Node group** - a `no-restricted-imports` group that bans Node builtins.
