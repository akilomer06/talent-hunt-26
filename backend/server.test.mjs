import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

test('API enforces origins, authentication, validation and database errors', async () => {
  const calls = [];
  let databaseFails = false;
  const server = createApiServer({
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test-key',
    FRONTEND_URL: 'https://frontend.vercel.app', ADMIN_PASSCODE: 'private-test-passcode', SESSION_SECRET: 'test-secret',
  }, async (url, options) => {
    calls.push({ url, options });
    if (databaseFails) return new Response('unavailable', { status: 503 });
    if (options.method) return new Response(null, { status: 204 });
    return Response.json([]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + '/api/registrations')).status, 401);
    assert.equal(calls.length, 0);
    assert.equal((await fetch(base + '/api/content', { headers: { Origin: 'https://wrong.vercel.app' } })).status, 403);
    const preflight = await fetch(base + '/api/registrations', { method: 'OPTIONS', headers: { Origin: 'https://frontend.vercel.app' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://frontend.vercel.app');
    assert.equal((await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'wrong' }) })).status, 401);
    const login = await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'private-test-passcode' }) });
    const { token } = await login.json();
    assert.equal((await fetch(base + '/api/registrations', { headers: { Authorization: 'Bearer ' + token + 'x' } })).status, 401);
    assert.equal((await fetch(base + '/api/registrations', { headers: { Authorization: 'Bearer ' + token } })).status, 200);
    assert.equal((await fetch(base + '/api/registrations', { method: 'POST', body: '{}' })).status, 400);
    const record = { reg_id: 'TEST', name: 'Test', rrn: '123', mobile: '1234567890', programme: 'BTech', year: '1', department: 'CSE', selected_events: ['code-break'], team_members: [], id: 'must-not-forward' };
    assert.equal((await fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify(record) })).status, 201);
    assert.equal(JSON.parse(calls.at(-1).options.body).id, undefined);
    databaseFails = true;
    assert.equal((await fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify(record) })).status, 502);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
