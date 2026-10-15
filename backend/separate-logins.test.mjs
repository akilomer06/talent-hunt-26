import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

test('separate environment passcodes and retry counters for each portal', async () => {
  const rows = new Map();
  const server = createApiServer({
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', SUPABASE_SECRET_KEY: 'private',
    ADMIN_PASSCODE: 'main-test-secret', REGISTRATION_TEAM_PASSCODE: 'team-test-secret', SESSION_SECRET: 'stable-secret',
  }, async (_url, options) => {
    if (options.headers.apikey === 'public') return new Response(null, { status: 403 });
    if (options.method === 'POST') {
      const row = JSON.parse(options.body);
      rows.set(row.key, row);
      return new Response(null, { status: 204 });
    }
    return Response.json([...rows.values()]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = (portal, passcode) => fetch(base + '/api/' + portal + '/login', { method: 'POST', body: JSON.stringify({ passcode }) });
  try {
    const team = await login('adminregistration', 'team-test-secret');
    assert.equal(team.status, 200);
    const teamSession = await team.json();
    assert.equal(teamSession.role, 'registration');
    assert.equal((await login('adminregistration', 'main-test-secret')).status, 401);
    const wrongMain = await login('admin', 'team-test-secret');
    assert.equal(wrongMain.status, 401);
    assert.equal((await wrongMain.json()).error, 'Incorrect main-admin passcode');
    for (let i = 0; i < 9; i++) assert.equal((await login('adminregistration', 'wrong')).status, 401);
    const limited = await login('adminregistration', 'wrong');
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('Retry-After')) > 0);
    const main = await login('admin', 'main-test-secret');
    assert.equal(main.status, 200);
    const mainSession = await main.json();
    assert.equal(mainSession.role, 'admin');
    const protectedWrite = await fetch(base + '/api/content/settings', { method: 'PUT', body: '{}', headers: { Authorization: 'Bearer ' + teamSession.token } });
    assert.equal(protectedWrite.status, 403);
    const revoke = await fetch(base + '/api/admin/access', { method: 'PUT', body: JSON.stringify({ enabled: false }), headers: { Authorization: 'Bearer ' + mainSession.token } });
    assert.equal(revoke.status, 200);
    const revokedSession = await fetch(base + '/api/registrations', { headers: { Authorization: 'Bearer ' + teamSession.token } });
    assert.equal(revokedSession.status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
