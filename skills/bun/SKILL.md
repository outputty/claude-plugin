---
name: bun
description: Bun runtime traps and fixes. Use when a script runs under Bun.
---

# bun

## Do

- Name a local helper anything but `declare`.
- Read `bun build --no-bundle <file>` when a script behaves differently under Bun and Node.
- Measure memory under Bun with `bun:jsc`'s `heapStats()` and `memoryUsage()`.
- Use `AsyncLocalStorage` under Bun.

## Don't

- Don't call a local function `declare`.
- Don't use `node:async_hooks` hooks or `PerformanceObserver('gc')` under Bun.

## Glossary

- **`bun build --no-bundle`** - prints the JavaScript Bun runs for one file, after its TypeScript transform.
