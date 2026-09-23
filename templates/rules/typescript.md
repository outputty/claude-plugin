---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript

- Place `@ts-expect-error` directly above the exact line that raises, never above the first line of a chained statement.
- Declare a callback's return type as a bare `void`, never `void | Promise<void>`.
- Put a conditional type that must distribute over a union in its own `type X<P> = P extends …`, never over an indexed access.
- Constrain a generic parameter over an invariant type with `Foo<any>`.
- Open a closed string union with a declaration-merged registry interface plus `keyof`, never with `(string & {})`.
- Write a type probe's negative cases as `@ts-expect-error`, and read `TS2578: Unused '@ts-expect-error'` as the case passing unnoticed.
- Set no `baseUrl`: TypeScript 7 fails a config carrying it with `TS5102`.
- Re-declare an inherited method in a subclass when only its return type must narrow.
- Quote a diagnostic under a `@ts-expect-error` only after removing the directive and running the typecheck.
