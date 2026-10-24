import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';

test('production policy accepts Trashion only and keeps participant, duplicate and category limits', async () => {
  const rows = new Map();
  let writes = 0;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (url, options) => {
    if (options.method === 'POST') {
      writes++;
      const row = JSON.parse(options.body);
      rows.set(row.reg_id, row);
      return Response.json([row]);
    }
    const regId = new URL(url).searchParams.get('reg_id')?.slice(3);
    return Response.json(regId ? (rows.has(regId) ? [rows.get(regId)] : []) : [...rows.values()]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const person = { name: 'Test Student', rrn: '001', mobile: '9000000000', programme: 'B.Tech', year: 'III', department: 'CSE', section: 'A' };
  const draft = { ...person, reg_id: 'TRASHION', selected_events: ['trashion'], team_members: [] };
  const post = (body, token) => fetch(base + (token ? '/api/admin/registrations' : '/api/registrations'), { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: JSON.stringify(body) });
  try {
    assert.equal((await post({ ...draft, selected_events: ['trashion', 'code-break'] })).status, 409);
    assert.equal(writes, 0);
    const oversized = { ...draft, team_members: Array.from({ length: 5 }, (_, index) => ({ ...person, rrn: String(index + 2), event_id: 'trashion' })) };
    assert.equal((await post(oversized)).status, 400);
    assert.equal(writes, 0);
    const fiveParticipants = { ...draft, team_members: oversized.team_members.slice(0, 4) };
    assert.equal((await post(fiveParticipants)).status, 201);
    assert.equal(writes, 1);
    assert.deepEqual(rows.get('TRASHION').selected_events, ['trashion']);
    assert.equal((await post({ ...draft, reg_id: 'DUPLICATE' })).status, 409);
    assert.equal(writes, 1);
    rows.clear();
    rows.set('OTHER-EVENT', { ...draft, selected_events: ['bgmi'] });
    assert.equal((await post(draft)).status, 409);
    assert.equal(writes, 1);
    rows.clear();
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'admin' }) })).json();
    const adminDraft = { ...draft, request_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
    assert.equal((await post(adminDraft, token)).status, 201);
    assert.equal(writes, 2);
    assert.equal((await post(adminDraft, token)).status, 200);
    assert.equal(writes, 2);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
