---
name: node-cluster
description: node:cluster traps and fixes. Use when code imports node:cluster.
---

# node-cluster

## Do

- Share one async generator across consumers to deal values to free slots.
- Pass a function-valued option through `cluster.fork()`; the worker builds it.
- Keep per-stream state in the connection.
- Kill workers to let a script exit.
- Call `listen(0)` in each worker for the one shared port.
- Size the chunk before choosing structured clone or loopback HTTP and JSON.
- Resolve a `.ts` worker's runtime imports without tsconfig `paths`.

## Don't

- Don't put a top-level side effect in a worker's entry module.
- Don't build a distributor or a per-consumer queue.
- Don't call `worker.process.unref()` to release the shared server handle.
- Don't use an aliased runtime import in a worker.

## Glossary

- **Free slot** - a worker ready to take the next value.
- **Shared port** - the one port every worker's `listen(0)` binds through the primary.
