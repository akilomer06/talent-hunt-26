import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { matchesPostgrestFilter } from './postgrest-test-helper.mjs';

test('admin deletion targets one database record and verifies it was removed', async () => {
  const rows = new Map([['REMOVE', { reg_id: 'REMOVE' }], ['KEEP', { reg_id: 'KEEP' }]]);
  let fail = false;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'main-test' }, async (url, options) => {
    if (options.method === 'DELETE') {
      assert.equal(options.headers.Prefer, 'return=representation');
      const filter = new URL(url).searchParams.get('reg_id');
      assert.ok(filter.startsWith('eq.'));
      const regId = filter.slice(3);
      if (fail) return Response.json({ code: 'ERROR' }, { status: 500 });
      const row = rows.get(regId);
      if (row && !matchesPostgrestFilter(row, new URL(url).searchParams)) return Response.json([]);
      rows.delete(regId);
      return Response.json(row ? [row] : []);
    }
    const params = new URL(url).searchParams;
    return Response.json([...rows.values()].filter(row => matchesPostgrestFilter(row, params)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'main-test' }) })).json();
    const remove = id => fetch(base + '/api/registrations/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    assert.equal((await remove('REMOVE')).status, 200);
    assert.equal(rows.has('REMOVE'), false);
    assert.equal(rows.has('KEEP'), true);
    const remaining = await (await fetch(base + '/api/registrations', { headers: { Authorization: 'Bearer ' + token } })).json();
    assert.deepEqual(remaining, [{ reg_id: 'KEEP' }]);
    assert.equal((await remove('REMOVE')).status, 404);
    fail = true;
    assert.equal((await remove('KEEP')).status, 502);
    assert.equal(rows.has('KEEP'), true);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('admin delete preserves a changed record, deletes only the reviewed pass, and persists across roster reloads', async () => {
  const source = { reg_id: 'REVIEW', name: 'A "B", C + (III)', rrn: '001', mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: '', selected_events: ['code-break'], team_members: [] };
  const rows = new Map([[source.reg_id, structuredClone(source)], ['UNRELATED', { ...source, reg_id: 'UNRELATED', rrn: '002' }]]);
  let writes = 0;
  const server = createApiServer({ SUPABASE_URL: 'https://delete-check.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (url, options) => {
    const params = new URL(url).searchParams;
    const matches = [...rows.values()].filter(row => matchesPostgrestFilter(row, params));
    if (options.method === 'DELETE') { writes++; for (const row of matches) rows.delete(row.reg_id); }
    return Response.json(matches);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'admin' }) })).json();
    const headers = { Authorization: 'Bearer ' + token };
    const remove = expected => fetch(base + '/api/registrations/REVIEW', { method: 'DELETE', headers, body: JSON.stringify({ expected }) });
    assert.equal((await remove({ ...source, name: 'Old name' })).status, 409);
    assert.equal(writes, 0);
    const deleted = await remove(source);
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { success: true, reg_id: source.reg_id });
    const refreshed = await (await fetch(base + '/api/registrations', { headers })).json();
    assert.deepEqual(refreshed.map(row => row.reg_id), ['UNRELATED']);
    assert.equal(writes, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
