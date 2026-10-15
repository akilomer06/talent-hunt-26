import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

test('registration-team sessions are read-only, persistent and immediately revocable', async () => {
  const rows = new Map();
  let publicAccess = false;
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', SUPABASE_SECRET_KEY: 'secret-test', ADMIN_PASSCODE: 'main-admin-secret', SESSION_SECRET: 'stable-test-secret' };
  const database = async (url, options) => {
    if (options.headers.apikey === 'test') return new Response(null, { status: publicAccess ? 200 : 403 });
    if (options.method === 'POST') {
      const row = JSON.parse(options.body);
      rows.set(row.key, row);
      return new Response(null, { status: 204 });
    }
    if (url.includes('key=eq.')) return Response.json(rows.has('_registration_team_access') ? [rows.get('_registration_team_access')] : []);
    if (url.includes('key=in.')) return Response.json([]);
    return Response.json([]);
  };
  const start = async () => {
    const server = createApiServer(env, database);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return { server, url: `http://127.0.0.1:${server.address().port}` };
  };
  let { server, url } = await start();
  const call = (path, method = 'GET', body, token) => fetch(url + path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers: token ? { Authorization: 'Bearer ' + token } : {} });
  const login = async (passcode, portal = 'admin') => (await call('/api/admin/login', 'POST', { passcode, portal })).json();
  try {
    assert.equal((await call('/api/admin/login', 'POST', { passcode: 'team-secret', portal: 'registration' })).status, 401);
    const admin = await login('main-admin-secret');
    assert.equal(admin.role, 'admin');
    publicAccess = true;
    assert.equal((await call('/api/admin/access', 'PUT', { enabled: true, passcode: 'team-secret' }, admin.token)).status, 503);
    publicAccess = false;
    assert.equal((await call('/api/admin/access', 'PUT', { enabled: true, passcode: 'team-secret' }, admin.token)).status, 200);
    assert.ok(!JSON.stringify([...rows.values()]).includes('team-secret'));
    const team = await login('team-secret', 'registration');
    assert.equal(team.role, 'registration');
    assert.equal((await call('/api/registrations', 'GET', undefined, team.token)).status, 200);
    assert.equal((await call('/api/admin/session', 'GET', undefined, team.token)).status, 200);
    for (const [path, method, body] of [
      ['/api/admin/access', 'GET'], ['/api/admin/access', 'PUT', { enabled: false }],
      ['/api/content/settings', 'PUT', {}], ['/api/registrations/TEST', 'DELETE'],
    ]) assert.equal((await call(path, method, body, team.token)).status, 403);
    const forged = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 10000 })).toString('base64url') + '.' + team.token.split('.')[1];
    assert.equal((await call('/api/admin/access', 'GET', undefined, forged)).status, 401);
    assert.equal((await call('/api/admin/login', 'POST', { passcode: 'team-secret' })).status, 401);
    const publicRows = await (await call('/api/content')).json();
    assert.deepEqual(publicRows, []);
    assert.equal((await call('/api/admin/access', 'PUT', { enabled: false }, admin.token)).status, 200);
    assert.equal((await call('/api/registrations', 'GET', undefined, team.token)).status, 401);
    assert.equal((await call('/api/admin/login', 'POST', { passcode: 'team-secret', portal: 'registration' })).status, 401);
    assert.equal((await call('/api/admin/access', 'PUT', { enabled: true }, admin.token)).status, 200);
    assert.equal((await call('/api/registrations', 'GET', undefined, team.token)).status, 401);
    await new Promise(resolve => server.close(resolve));
    ({ server, url } = await start());
    const afterRestart = await login('team-secret', 'registration');
    assert.equal(afterRestart.role, 'registration');
    assert.equal((await call('/api/registrations', 'GET', undefined, afterRestart.token)).status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
