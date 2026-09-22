import { renderToReadableStream } from 'react-dom/server';
import { type EntryContext, ServerRouter } from 'react-router';

// Only the prerender uses this entry (docs pack 01 §6: ssr false, every route prerendered), so it
// always waits for the whole document instead of streaming a shell.
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
): Promise<Response> {
  let status = responseStatusCode;
  const stream = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} />, {
    signal: request.signal,
    onError(error: unknown) {
      status = 500;
      console.error(error);
    },
  });
  await stream.allReady;
  responseHeaders.set('Content-Type', 'text/html');
  return new Response(stream, { headers: responseHeaders, status });
}
