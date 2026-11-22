---
name: node-http
description: node:http traps and fixes. Use when code serves HTTP with node:http.
---

# node-http

## Do

- Bridge a fetch handler to Node with `Readable.toWeb(req)` as the `Request` body and `res.write()` per response frame: [references/streaming-bridge.ts](references/streaming-bridge.ts)
- Stream both ways over one `fetch`, with no SSE or WebSocket.
- Feed a duplex probe's body before awaiting its `fetch`.
- Use `JSON.stringify` and `JSON.parse` for plain row chunks.
- Impose your own body limit.
- Count the server's `connection` events before blaming connection churn.

## Don't

- Don't return a `Response` from a `createServer` callback.
- Don't buffer `req` and end with `res.end(await response.arrayBuffer())`.
- Don't use `node:v8` structured-clone serialize for row chunks.

## Glossary

- **Response frame** - one chunk of a streamed response body, written with `res.write()`.
- **Duplex probe** - a `fetch` that streams its request body while it reads the response.
