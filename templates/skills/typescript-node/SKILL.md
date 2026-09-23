---
name: typescript-node
description: TypeScript and Node tooling traps - ts-pattern exhaustiveness, oxlint config and import bans, tsup builds and dual ESM/CJS output, Bun vs Node differences, Node HTTP servers and streaming fetch, node:cluster workers, Standard Schema, Standard JSON Schema and TypeBox.
---

# typescript-node

The TypeScript and Node traps a strong model still gets wrong, grouped by the problem, with the tool named on each line.

## Exhaustive matching

- **`.exhaustive()` refuses at a generic site** (ts-pattern) - where the matched value's type is a type parameter, it fails even with every arm present: `TS2349 ... 'NonExhaustiveError<unknown>' has no call signatures`, identical to a missing arm. Probe with the real site's type parameter, never a concrete union.
- **`.otherwise()` compiles everywhere and checks nothing** (ts-pattern) - a case added later falls into it silently. To keep the check under a generic, wrap the value in a concrete tagged union.
- **`P.symbol` is the wildcard** (ts-pattern) - it matches any symbol. Pass the symbol itself to `.with(MY_SYMBOL)` to match one.
- **A match costs per call** (ts-pattern) - keep `match()` out of per-element loops. An object pattern costs much more than a literal one, and `.exhaustive()` costs more than `.otherwise()` at runtime.
- **A bundler that inlines dependencies ships ts-pattern inside the artifact** - mark it external if the package should not carry it.

## Lint-enforced boundaries

- **Check the linter before writing a structural rule as prose** - an import boundary or a banned module is a config line, not a sentence.
- **A `no-restricted-imports` group `*` does not cross `/`** (oxlint) - `node:*` misses `node:fs/promises`. Use both forms:

  ```json
  { "group": ["node:*", "node:*/**"] }
  ```

- **Prefer `import/no-nodejs-modules` with `{ allow: [...] }`** (oxlint) - it knows every prefixed and bare builtin, with no glob to author.
- **Carve an exception with `excludeFiles` on one broad override** (oxlint) - not with two overrides on the same files; last-match-wins between overrides is undocumented.
- **`no-restricted-syntax` does not ship in oxlint** - no generic AST-pattern ban is available.
- **`no-extend-native` does not catch `class X extends Function`** (oxlint) - it covers prototype mutation only, and no rule covers the `extends` clause.

## Building and publishing a package

- **ESM splits chunks by default, CJS does not** (tsup) - a second entry sharing a class breaks `instanceof` only in the CJS build. Set `splitting: true`, then check by running the built entries, not `src`.
- **Split CJS writes `require('ws')` with single quotes** (tsup) - ESM keeps `from "ws"`. Grep both quote styles: `rg "[\"']ws[\"']"`.
- **Prove a package is absent from an entry** - copy `dist` and `package.json` into a directory with no `node_modules`, run the entry, and control with an entry that must fail.
- **A `.d.ts` importing an untyped optional package fails strict consumers** - `TS2307` when absent, `TS7016` when present without `@types/`. `skipLibCheck: true` hides both. Type published parameters with `node:` type-only imports, never `Parameters<>` off the optional package.
- **`moduleResolution: node10` is gone in TypeScript 7** - it reports `TS5108`.
- **A `node:` import reaches built output with the prefix stripped** (tsup) - `node:cluster` becomes `cluster`. Grep a downstream resolution failure for the bare name.

## Bun versus Node

- **Bun's transpiler drops calls to a local function named `declare`** - `if (x) declare(y)` becomes `if (x) ;` with no error; Node and esbuild keep the call. Name the helper anything else.
- **Read `bun build --no-bundle <file>` as the truth** - when a script behaves differently under Bun and Node, the transpiled text shows why.
- **`node:async_hooks` hooks and `PerformanceObserver('gc')` never fire under Bun** - they register without error. Measure with `bun:jsc`'s `heapStats()`/`memoryUsage()`. `AsyncLocalStorage` does work.

## Serving and streaming HTTP on Node

- **`createServer(async () => new Response(...))` hangs** (Node) - the returned `Response` is ignored and nothing is written to `res`. Node needs a bridge from a fetch handler.
- **Node `fetch` streams both ways over one request** - response frames arrive while the request body is still open, so continuous-in/continuous-out needs no SSE or WebSocket.
- **A streaming bridge** - pass `Readable.toWeb(req)` as the `Request` body, then write each response frame with `res.write()`:

  ```ts
  for await (const chunk of response.body) res.write(chunk);
  res.end();
  ```

- **A buffering bridge defeats duplex streaming with no error** - collecting `req` and ending with `res.end(await response.arrayBuffer())` loses no data, so nothing reports it.
- **A duplex probe that awaits `fetch` before feeding its own body falsely shows half-duplex** - the body is never pushed and the request times out.
- **`node:v8` structured-clone serialize is slower than JSON** - `JSON.stringify`/`parse` wins on plain row chunks, for a barely smaller payload.
- **`http.Server` limits header size only** - there is no body limit; impose your own.
- **Count server `connection` events before blaming connection churn** - for a `fetch` versus `node:http` gap; both reuse sockets.

## Multi-process with node:cluster

- **N consumers sharing one async generator each get distinct values** - concurrent `next()` calls serialize, so this is already free-slot dealing: no distributor, no per-consumer queue.
- **A function-valued option passes through `cluster.fork()`** - the worker re-runs the entry module and builds it itself; nothing is serialized.
- **The same re-run is a trap** - every top-level side effect in the entry module runs once per worker plus once in the primary.
- **Keep per-stream state in the connection** - one long-lived HTTP request stays on one worker; the primary distributes connections, never frames.
- **Kill cluster workers to let a script exit** - `worker.process.unref()` cannot release the shared server handle the primary holds.
- **`listen(0)` inside a cluster gives every worker the same port** - no port-picking dependency needed.
- **Structured clone beats loopback HTTP+JSON for small chunks and loses for large ones** - size the chunk before choosing the transport.
- **A `.ts` worker's runtime imports must resolve without tsconfig `paths`** - Node never reads them; an aliased runtime import dies with `ERR_MODULE_NOT_FOUND`. A type-only alias erases and is fine.

## Schema libraries and Standard Schema

- **Probe `schema["~standard"]` against the installed version** - never trust an adoption claim.
- **Standard JSON Schema is separate from `validate`** - zod 4 and arktype 2 carry `~standard.jsonSchema`; valibot 1 does not, so use `@valibot/to-json-schema`.
- **TypeBox has two incompatible generations** - `@sinclair/typebox` 0.x (ESM and CJS) and `typebox` 1.x (ESM only). Neither implements Standard Schema or Standard JSON Schema; grep the installed package for `~standard`.
- **A TypeBox `TSchema` is already JSON Schema** - pass it straight through as `jsonSchema.output()`; no converter is needed.
- **TypeBox errors use `instancePath`, not `path`** (AJV-style) - and it applies no RFC 6901 escaping, so a key `"a/b"` reads the same as nested `a.b`. Walk the schema's own `properties` to recover segments, never `split("/")`.
