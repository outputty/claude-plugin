import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

export async function bridge(
  handler: (request: Request) => Promise<Response>,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    body: Readable.toWeb(req) as ReadableStream,
    duplex: "half",
  } as RequestInit);
  const response = await handler(request);
  res.writeHead(response.status);
  for await (const chunk of response.body!) res.write(chunk);
  res.end();
}
