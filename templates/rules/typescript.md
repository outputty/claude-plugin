---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
---

# TypeScript

## Assertions

From [mimo's asserts glossary](https://mimo.org/glossary/typescript/asserts), Matt Pocock's _Total TypeScript_ and a probe against TypeScript 7.

- A public entry parses unchecked input once with the repo's schema library, such as Zod, in place of hand-written narrowing; nothing inside parses again.
- Inside, state what the code expects with assertion functions: `asserts value is T` to narrow a type, `assert(condition, message)` from `node:assert` for a value's range or shape. Each throws naming what was expected.
- Use `as` only where you know more than the compiler: name the most specific type, and look first for a refactor the compiler can follow. Never `as unknown as T` or `!`. `as const` stays.
- Use a type guard, `value is T`, where both outcomes are valid and the code branches or filters; an assertion function where the wrong type is an error.
- Declare an assertion function with `function`, or annotate its variable's type: an arrow with only a return annotation raises `TS2775` at the call.
- The compiler trusts the signature: a body that forgets to throw still narrows.

## Testing

- Start the test watcher once, in the background, before the first edit: the repo's watch script, else `vitest watch --standalone`, with its output written to a file. Leave it running for the whole session, across every ticket.
- After every edit, read the watcher's latest result before the next edit, and fix a failure before writing anything else.
- Outside the watcher, run only what the change reaches: `vitest related <files> --run`, or `vitest run --sinceLastRun`.

## Docstrings

- A docstring is TSDoc: its parts go in the summary, `@param`, `@returns`, `@throws` and `@example`.

## Types

- Place `@ts-expect-error` directly above the exact line that raises, never above the first line of a chained statement.
- Quote a diagnostic under a `@ts-expect-error` only after removing the directive and running the typecheck. After widening a gate on a member, remove and restore every `@ts-expect-error` on that member.
- Write a type probe's negative cases as `@ts-expect-error`, and read `TS2578: Unused '@ts-expect-error'` as the case passing unnoticed. Probe a guard's reject and accept cases before removing or keeping it.
- Declare a callback's return type as a bare `void`, never `void | Promise<void>`.
- Put a conditional type that must distribute over a union in its own `type X<P> = P extends …`, never over an indexed access. Wrap an `infer`-captured value checked again later as `[X] extends [true]`.
- Put a plain overload for the fully supplied shape ahead of a conditional-type-gated one.
- Constrain a generic parameter over an invariant type with `Foo<any>`.
- Open a closed string union with a declaration-merged registry interface plus `keyof`, never with `(string & {})`.
- Re-declare an inherited method in a subclass, marked `override`, when only its return type must narrow.
- Give a promise that is raced or awaited later a `.catch(() => {})` at creation.
- Write `return await` inside an `await using` scope.
- Set no `baseUrl`: TypeScript 7 fails a config carrying it with `TS5102`.
