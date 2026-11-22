---
name: standard-schema
description: Standard Schema and TypeBox traps and fixes. Use when code validates with them.
---

# standard-schema

## Do

- Probe `schema["~standard"]` against the installed version.
- Use `@valibot/to-json-schema` for valibot 1.
- Search the installed TypeBox package for `~standard`.
- Pass a TypeBox `TSchema` straight through as `jsonSchema.output()`.
- Walk the schema's own `properties` to recover path segments from `instancePath`.

## Don't

- Don't trust an adoption claim.
- Don't `split("/")` an `instancePath`.

## Glossary

- **`~standard`** - the property through which a Standard Schema validator exposes itself.
- **`instancePath`** - a JSON Pointer to the failing value, with `/` inside a key written as `~1`.
