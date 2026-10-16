import * as https from 'node:https';

/** Obsidian runs in a renderer: use Node HTTPS so OAuth and SSE do not depend on browser CORS. */
export const chatgptFetch: typeof fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.protocol !== 'https:') throw new Error('ChatGPT requires HTTPS.');
  return new Promise<Response>((resolve, reject) => {
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    const request = https.request(url, {
      method: init.method || 'GET',
      headers: { 'accept-encoding': 'identity', ...headers },
    });
    const abort = () => request.destroy(new Error('Request cancelled.'));
    const cleanup = () => init.signal?.removeEventListener('abort', abort);
    request.once('error', error => {
      cleanup();
      reject(error);
    });
    init.signal?.addEventListener('abort', abort, { once: true });
    if (init.signal?.aborted) {
      abort();
      return;
    }
    request.once('response', response => {
      const resultHeaders = new Headers();
      for (const [name, value] of Object.entries(response.headers))
        if (value !== undefined) resultHeaders.set(name, Array.isArray(value) ? value.join(', ') : value);
      const status = response.statusCode || 502;
      if ([204, 205, 304].includes(status)) {
        response.resume();
        cleanup();
        resolve(new Response(null, { status, headers: resultHeaders }));
        return;
      }
      let ended = false;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          response.on('data', chunk => {
            if (ended) return;
            controller.enqueue(new Uint8Array(chunk));
            if ((controller.desiredSize || 0) <= 0) response.pause();
          });
          response.once('end', () => {
            if (ended) return;
            ended = true;
            cleanup();
            controller.close();
          });
          response.once('error', () => {
            if (!ended) {
              ended = true;
              cleanup();
              controller.error(new Error('OpenAI stream interrupted.'));
            }
          });
          response.once('aborted', () => {
            if (!ended) {
              ended = true;
              cleanup();
              controller.error(new Error('OpenAI stream interrupted.'));
            }
          });
        },
        pull() {
          response.resume();
        },
        cancel() {
          ended = true;
          cleanup();
          response.destroy();
          request.destroy();
        },
      });
      resolve(new Response(stream, { status, headers: resultHeaders }));
    });
    request.end(typeof init.body === 'string' ? init.body : undefined);
  });
};
