---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
---

# TypeScript

- Place `@ts-expect-error` directly above the exact line that raises, never above the first line of a chained statement.
- Quote a diagnostic under a `@ts-expect-error` only after removing the directive and running the typecheck. After widening a gate on a member, remove and restore every `@ts-expect-error` on that member.
- Write a type probe's negative cases as `@ts-expect-error`, and read `TS2578: Unused '@ts-expect-error'` as the case passing unnoticed. Probe a guard's reject and accept cases before removing or keeping it.
- A passing type test proves nothing at runtime; run the read path too.
- Declare a callback's return type as a bare `void`, never `void | Promise<void>`.
- Put a conditional type that must distribute over a union in its own `type X<P> = P extends …`, never over an indexed access. Wrap an `infer`-captured value checked again later as `[X] extends [true]`.
- Put a plain overload for the fully supplied shape ahead of a conditional-type-gated one.
- Constrain a generic parameter over an invariant type with `Foo<any>`.
- Open a closed string union with a declaration-merged registry interface plus `keyof`, never with `(string & {})`.
- Re-declare an inherited method in a subclass when only its return type must narrow.
- Give a promise that is raced or awaited later a `.catch(() => {})` at creation.
- Write `return await` inside an `await using` scope, or the resource is disposed before the promise settles.
- Set no `baseUrl`: TypeScript 7 fails a config carrying it with `TS5102`.
