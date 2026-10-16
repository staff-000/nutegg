import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { chatgptFetch } from '../src/chatgpt-http';
const https = require('node:https');

test('ChatGPT transport uses Node HTTPS and streams independently of browser fetch', async t => {
  const sent: any[] = [];
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Browser fetch must not run');
  });
  t.mock.method(https, 'request', (url: URL, options: any) => {
    const request: any = new EventEmitter();
    request.destroy = () => request;
    request.end = (body: string) => {
      sent.push({ url: url.href, options, body });
      const response: any = Readable.from([Buffer.from('first'), Buffer.from(' second')]);
      response.statusCode = 200;
      response.headers = { 'content-type': 'text/event-stream' };
      queueMicrotask(() => request.emit('response', response));
    };
    return request;
  });
  const response = await chatgptFetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer private-token' },
    body: '{"stream":true}',
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'first second');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].options.headers.authorization, 'Bearer private-token');
  assert.equal(sent[0].body, '{"stream":true}');
});

test('cancelled transport destroys the Node request and rejects before opening a connection', async t => {
  let destroyed = false;
  t.mock.method(https, 'request', () => {
    const request: any = new EventEmitter();
    request.destroy = (error: Error) => {
      destroyed = true;
      queueMicrotask(() => request.emit('error', error));
    };
    return request;
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(chatgptFetch('https://api.openai.com/v1/models', { signal: controller.signal }));
  assert.equal(destroyed, true);
});

test('transport rejects HTTP and does not follow redirects', async t => {
  await assert.rejects(chatgptFetch('http://api.openai.com/v1/models'), /HTTPS/);
  let calls = 0;
  t.mock.method(https, 'request', () => {
    ++calls;
    const request: any = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      const response: any = Readable.from([]);
      response.statusCode = 302;
      response.headers = { location: 'https://attacker.example' };
      queueMicrotask(() => request.emit('response', response));
    };
    return request;
  });
  const response = await chatgptFetch('https://auth.openai.com/.well-known/openid-configuration');
  await response.text();
  assert.equal(response.status, 302);
  assert.equal(calls, 1);
});
