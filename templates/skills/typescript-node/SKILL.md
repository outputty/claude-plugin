---
name: typescript-node
description: TypeScript and Node traps and fixes - types that check fast, oxlint import bans, Bun vs Node, node:http streaming, node:cluster workers, Standard Schema and TypeBox. Use when writing TypeScript types or Node code that touches these, and when code runs differently under Bun and Node (a script prints another value under bun run than under node, function hoisting, evaluation order), a node:http server hangs or never responds, tsc is slow on a type, a lint ban misses an import, or a schema error's path needs reading.
---

# typescript-node

## Types that check fast

### Do

- Type a callback's return as the one state field you read: [references/do-callback-returns-state.ts](references/do-callback-returns-state.ts)
- Give a builder only the type parameters its members use: [references/do-lean-builder.ts](references/do-lean-builder.ts)
- Keep accumulated state in one map of named entries: [references/do-one-registry-map.ts](references/do-one-registry-map.ts)
- Export an interface as the public type, keep the class internal, and move members without type parameters to a non-generic base interface: [references/do-interface-surface.ts](references/do-interface-surface.ts)
- Validate a constructor literal with a type parameter on the construct signature: [references/do-literal-on-construct-signature.ts](references/do-literal-on-construct-signature.ts)
- Validate each value where it is written, with a string literal type as the error message: [references/do-check-where-written.ts](references/do-check-where-written.ts)
- Use a generic `this` parameter in builder methods: [references/do-this-parameter.ts](references/do-this-parameter.ts)
- Add variance annotations (`in`, `out`, `in out`) to hot generic types, and let `tsc` verify them: [references/do-variance.ts](references/do-variance.ts)
- Name each object type used inside a generic member: [references/do-named-object-type.ts](references/do-named-object-type.ts)
- Type a fact the run time also holds from the member that holds it: [references/do-real-member.ts](references/do-real-member.ts)
- Keep a phantom property, such as `__state?`, for facts only the type checker needs: [references/do-callback-returns-state.ts](references/do-callback-returns-state.ts)
- Pass a generic helper's type argument explicitly: [references/do-explicit-type-argument.ts](references/do-explicit-type-argument.ts)
- Back every `tsc` refusal with a run-time check that gives the same message: [references/do-runtime-twin.ts](references/do-runtime-twin.ts)
- Measure with `tsc --extendedDiagnostics --checkers 1`.

### Don't

- Don't pass an accumulated registry type into builder types that never read it: [references/dont-registry-in-builder.ts](references/dont-registry-in-builder.ts)
- Don't type a callback's return as the full builder type: [references/dont-callback-returns-builder.ts](references/dont-callback-returns-builder.ts)
- Don't return a new builder type from a method to record a fact: [references/dont-new-builder-per-fact.ts](references/dont-new-builder-per-fact.ts)
- Don't export a generic class as the public type: [references/dont-public-generic-class.ts](references/dont-public-generic-class.ts)
- Don't add a class type parameter only to validate a literal: [references/dont-literal-class-parameter.ts](references/dont-literal-class-parameter.ts)
- Don't use the polymorphic `this` type in builder methods: [references/dont-polymorphic-this.ts](references/dont-polymorphic-this.ts)
- Don't write an anonymous object type that references an outer type parameter inside a generic member: [references/dont-anonymous-object-type.ts](references/dont-anonymous-object-type.ts)
- Don't compare each new entry against every earlier entry at the type level: [references/dont-compare-all-entries.ts](references/dont-compare-all-entries.ts)
- Don't look up a declaration-merged registry on every chained call: [references/dont-merged-registry-per-call.ts](references/dont-merged-registry-per-call.ts)
- Don't add a phantom property for a fact the run time also holds.

## oxlint

### Do

- Put an import boundary or a banned module in the linter's config, not in prose.
- Ban a Node builtin with both forms: [references/oxlint-node-group.json](references/oxlint-node-group.json)
- Use `import/no-nodejs-modules` with `{ allow: [...] }` to allow named builtins.
- Carve an exception with `excludeFiles` on one broad override.

### Don't

- Don't write `node:*` alone in a `no-restricted-imports` group.
- Don't carve an exception with two overrides on the same files.
- Don't reach for `no-restricted-syntax`.
- Don't rely on `no-extend-native` to catch `class X extends Function`.

## Bun versus Node

### Do

- Read `bun build --no-bundle <file>` when a script behaves differently under Bun and Node.
- Measure memory under Bun with `bun:jsc`'s `heapStats()` and `memoryUsage()`.
- Use `AsyncLocalStorage` under Bun.

### Don't

- Don't use `node:async_hooks` hooks or `PerformanceObserver('gc')` under Bun.

## Node HTTP

### Do

- Bridge a fetch handler to Node with `Readable.toWeb(req)` as the `Request` body and `res.write()` per response frame: [references/streaming-bridge.ts](references/streaming-bridge.ts)
- Stream both ways over one `fetch`, with no SSE or WebSocket.
- Feed a duplex probe's body before awaiting its `fetch`.
- Use `JSON.stringify` and `JSON.parse` for plain row chunks.
- Impose your own body limit.
- Count the server's `connection` events before blaming connection churn.

### Don't

- Don't buffer `req` and end with `res.end(await response.arrayBuffer())`.
- Don't use `node:v8` structured-clone serialize for row chunks.

## node:cluster

### Do

- Share one async generator across consumers to deal values to free slots.
- Pass a function-valued option through `cluster.fork()`; the worker builds it.
- Keep per-stream state in the connection.
- Call `listen(0)` in each worker for the one shared port.
- Size the chunk before choosing structured clone or loopback HTTP and JSON.
- Resolve a `.ts` worker's runtime imports without tsconfig `paths`.

### Don't

- Don't put a top-level side effect in a worker's entry module.
- Don't build a distributor or a per-consumer queue.
- Don't call `worker.process.unref()` to release the shared server handle.
- Don't use an aliased runtime import in a worker.

## Standard Schema and TypeBox

### Do

- Probe `schema["~standard"]` against the installed version.
- Use `@valibot/to-json-schema` for valibot 1.
- Search the installed TypeBox package for `~standard`.
- Pass a TypeBox `TSchema` straight through as `jsonSchema.output()`.
- Walk the schema's own `properties` to recover path segments from `instancePath`.

### Don't

- Don't trust an adoption claim.
- Don't `split("/")` an `instancePath`.

## Glossary

- **Type parameter** - the type name a generic function takes, such as `S` in `area<S extends Shape>`.
- **Phantom property** - an optional property that exists only for the type checker and holds nothing at run time.
- **Accumulated registry type** - a type that grows by one entry per `add` call.
- **Builder** - an object whose chained methods collect settings before a build.
- **State field** - the one member of a builder's result that carries the fact a caller reads.
- **Record a fact** - make a type remember something a call did, such as a name set.
- **Construct signature** - the `new (...)` member of an interface that types a class's constructor.
- **Hot generic type** - a generic type the checker instantiates many times.
- **Checkers** - the type checker's worker count; `--checkers 1` stops repeated counts.
- **Declaration-merged registry** - an interface that several modules extend with `declare module`.
