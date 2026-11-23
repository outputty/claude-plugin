---
name: ts-pattern
description: ts-pattern traps and fixes. Use when code imports ts-pattern.
---

# ts-pattern

## Do

- Match a value whose type is a type parameter through its concrete union: [references/exhaustive-generic.ts](references/exhaustive-generic.ts)
- Test an exhaustive match with the real site's type parameter.
- Pass the symbol itself to match one symbol: `.with(MY_SYMBOL)`.
- Use a literal pattern rather than an object pattern on a hot path.

## Don't

- Don't call `.exhaustive()` on a value whose type is a type parameter.
- Don't use `.otherwise()` where every case must be handled.
- Don't use `P.symbol` to match one symbol.
- Don't call `match()` inside a per-element loop.

## Glossary

- **Type parameter** - the type name a generic function takes, such as `S` in `area<S extends Shape>`.
- **Concrete union** - a union type with no type parameter in it, such as `Shape`.
- **Exhaustive match** - a `match()` that ends in `.exhaustive()` and fails to compile when a case of its input has no arm.
- **Hot path** - code that runs once per element of a large input.
