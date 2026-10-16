import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

test('admin rosters fetch beyond the Supabase default page for complete exports', async () => {
  const offsets = [];
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test', SESSION_SECRET: 'test-secret' }, async url => {
    const offset = Number(new URL(url).searchParams.get('offset'));
    offsets.push(offset);
    return Response.json(Array.from({ length: offset === 0 ? 1000 : 1 }, (_, i) => ({ reg_id: `TEST-${offset + i}`, team_members: [] })));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'test' }) })).json();
    const response = await fetch(base + '/api/registrations', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 200);
    const records = await response.json();
    assert.equal(records.length, 1001);
    assert.equal(records.at(-1).reg_id, 'TEST-1000');
    assert.deepEqual(offsets, [0, 1000]);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
