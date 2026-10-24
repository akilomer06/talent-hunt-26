import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { matchesPostgrestFilter } from './postgrest-test-helper.mjs';

for (const rrn of ['240181601070', '240071603001']) test('final closure supersedes former FIFA exception for ' + rrn + ' and preserves existing passes', async () => {
  let writes = 0;
  let stored = { reg_id: 'KEEP', name: 'Test Student', rrn, mobile: '9000000000', programme: 'B.Tech', year: 'III', department: 'CSE', section: 'A', selected_events: ['code-canvas', 'fifa'], team_members: [], created_at: '2026-10-23T10:00:00Z' };
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'main-test' }, async (url, options) => {
    const params = new URL(url).searchParams;
    if (options.method === 'PATCH') {
      if (!matchesPostgrestFilter(stored, params)) return Response.json([]);
      writes++; stored = { ...stored, ...JSON.parse(options.body) };
      return Response.json([stored]);
    }
    if (options.method === 'POST') { writes++; return Response.json([]); }
    const filter = params.get('reg_id');
    return Response.json(!filter || filter === 'eq.KEEP' ? [stored] : []);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (path, body, token) => fetch(base + path, { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: JSON.stringify(body) });
  try {
    const { token } = await (await post('/api/admin/login', { passcode: 'main-test' })).json();
    assert.equal((await post('/api/admin/registration-exceptions', { rrn })).status, 401);
    assert.deepEqual(await (await post('/api/admin/registration-exceptions', { rrn }, token)).json(), { events: [] });
    const creation = { ...stored, reg_id: 'NEW', selected_events: ['fifa'], request_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
    assert.equal((await post('/api/registrations', creation)).status, 409);
    assert.equal((await post('/api/admin/registrations', creation, token)).status, 409);
    assert.equal(writes, 0);
    const update = record => fetch(base + '/api/registrations/KEEP', { method: 'PUT', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify({ record, expected: stored }) });
    assert.equal((await update({ ...stored, selected_events: ['prompt-pop', 'fifa'] })).status, 409);
    assert.equal((await update({ ...stored, rrn: 'OTHER' })).status, 409);
    assert.equal((await update({ ...stored, team_members: [{ name: 'New Teammate', rrn: 'NEW', mobile: '9000000001', programme: 'B.Tech', year: 'III', department: 'CSE', section: 'A', event_id: 'code-canvas' }] })).status, 409);
    assert.equal(writes, 0);
    assert.equal((await update({ ...stored, name: 'Corrected Name' })).status, 200);
    assert.deepEqual(stored.selected_events, ['code-canvas', 'fifa']);
    assert.equal(stored.created_at, '2026-10-23T10:00:00Z');
    assert.equal((await update({ ...stored, selected_events: ['code-canvas'] })).status, 200);
    assert.deepEqual(stored.selected_events, ['code-canvas']);
    assert.equal(writes, 2);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
