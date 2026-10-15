import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

test('health probes Supabase read-only, hides data and fails on database errors', async () => {
  const calls = [];
  let fails = false;
  const server = createApiServer({
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test-key',
    ADMIN_PASSCODE: 'test-passcode', SESSION_SECRET: 'test-secret',
  }, async (url, options) => {
    calls.push({ url, options });
    return fails ? new Response('unavailable', { status: 503 }) : Response.json([{ key: 'private-key' }]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/health`;
  try {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/site_content?select=key&limit=1');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[0].options.body, undefined);
    fails = true;
    assert.equal((await fetch(url)).status, 502);
    assert.ok(calls.every(call => call.options.method === 'GET' && call.options.body === undefined));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
