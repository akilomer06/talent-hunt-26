import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

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
      rows.delete(regId);
      return Response.json(row ? [row] : []);
    }
    return Response.json([...rows.values()]);
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
