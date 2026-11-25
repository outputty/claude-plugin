---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
---

# TypeScript

## Assertions

- Parse unchecked input once, at a public entry, with the repo's schema library, such as Zod.
- Inside, state what the code expects with assertion functions: `asserts value is T` to narrow a type, `assert(condition, message)` from `node:assert` for a value's range or shape, each throwing with what was expected.
- Use a type guard, `value is T`, where both outcomes are valid; an assertion function where the wrong type is an error.
- Declare an assertion function with `function`, or annotate its variable's type, and make its body throw: the compiler trusts the signature.
- Use `as` only where you know more than the compiler, with the most specific type, after looking for a refactor the compiler can follow. `as const` stays.
- Don't parse again inside, or narrow input by hand.
- Don't write `as unknown as T` or `!`.
- Don't declare an assertion function as an arrow with only a return annotation: the call raises `TS2775`.

## Testing

- Run no test watcher.
- After every edit, run `vitest run --sinceLastRun` with its output written to a file, read its result before the next edit, and fix a failure before writing anything else. It reruns only the tests whose files changed since their last run, plus the ones that failed.
- Run `vitest related <files> --run` when a file's importers matter more than what changed since the last run.
- Run the full suite only when the change is overarching, such as a shared type, a config, a build step or a rename across packages.

## Docstrings

- A docstring is TSDoc: its parts go in the summary, `@param`, `@returns`, `@throws` and `@example`.

## Types

- Place `@ts-expect-error` directly above the exact line that raises.
- Quote a diagnostic under a `@ts-expect-error` only after removing the directive and running the typecheck. After widening a gate on a member, remove and restore every `@ts-expect-error` on that member.
- Write a type probe's negative cases as `@ts-expect-error`, and read `TS2578: Unused '@ts-expect-error'` as the case passing unnoticed. Probe a guard's reject and accept cases before removing or keeping it.
- Declare a callback's return type as a bare `void`.
- Put a conditional type that must distribute over a union in its own `type X<P> = P extends …`. Wrap an `infer`-captured value checked again later as `[X] extends [true]`.
- Put a plain overload for the fully supplied shape ahead of a conditional-type-gated one.
- Constrain a generic parameter over an invariant type with `Foo<any>`.
- Open a closed string union with a declaration-merged registry interface plus `keyof`.
- Re-declare an inherited method in a subclass, marked `override`, when only its return type must narrow.
- Give a promise that is raced or awaited later a `.catch(() => {})` at creation.
- Write `return await` inside an `await using` scope.
- Don't place `@ts-expect-error` above the first line of a chained statement.
- Don't declare a callback's return as `void | Promise<void>`.
- Don't distribute a conditional type over an indexed access.
- Don't open a string union with `(string & {})`.
- Don't set `baseUrl`: TypeScript 7 fails a config carrying it with `TS5102`.
