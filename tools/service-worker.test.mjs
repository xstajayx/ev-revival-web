import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('offline cache stays within the EV public site', async () => {
  const events = {};
  const deleted = [];
  const saved = [];
  const cache = { put: async (request) => { saved.push(request.url); } };
  const context = {
    URL,
    self: {
      location: { origin: 'https://site.example' },
      clients: { claim() {} },
      addEventListener: (key, handler) => { events[key] = handler; },
    },
    caches: {
      keys: async () => ['other-product', 'ev-revival-v1', 'ev-revival-v2'],
      delete: async (key) => { deleted.push(key); },
      open: async () => cache,
    },
    fetch: async () => ({ ok: true, redirected: false, type: 'basic', clone() { return this; } }),
  };
  runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), context);
  let activation;
  events.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ['ev-revival-v1']);
  for (const url of [
    'https://other.example/index.html',
    'https://site.example/index.html?token=example',
    'https://site.example/ev-revival-local.html',
    'https://site.example/ev-revival-local/manifest.json',
  ]) {
    events.fetch({ request: { method: 'GET', url }, respondWith: () => assert.fail('Request should bypass cache') });
  }
  let response;
  let write;
  events.fetch({
    request: { method: 'GET', url: 'https://site.example/index.html' },
    respondWith: promise => { response = promise; },
    waitUntil: promise => { write = promise; },
  });
  assert.equal((await response).ok, true);
  await write;
  assert.deepEqual(saved, ['https://site.example/index.html']);
});
