import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { registrationUpdateFilter } from './registration-admin.mjs';

const source = { id: 'row-1', reg_id: 'KEEP', created_at: '2026-10-21T00:00:00Z', name: 'Test Person', rrn: '001', mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A', selected_events: ['game-craft', 'fifa'], team_members: [] };

test('manual admin edits and creation use isolated database mocks and preserve unrelated events/rows', async () => {
  const rows = new Map([['KEEP', structuredClone(source)], ['OTHER', { ...source, reg_id: 'OTHER', id: 'row-2' }]]);
  let writes = 0;
  let concurrent = false;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test-admin' }, async (url, options) => {
    if (options.method === 'PATCH') {
      writes++;
      const params = new URL(url).searchParams;
      assert.equal(params.get('reg_id'), 'eq."KEEP"');
      assert.equal(params.get('selected_events'), 'eq.' + JSON.stringify(rows.get('KEEP').selected_events));
      if (concurrent) return Response.json([]);
      const patch = JSON.parse(options.body);
      assert.equal(Object.hasOwn(patch, 'id'), false);
      assert.equal(Object.hasOwn(patch, 'created_at'), false);
      rows.set('KEEP', { ...rows.get('KEEP'), ...patch });
      return Response.json([rows.get('KEEP')]);
    }
    if (options.method === 'POST') {
      writes++;
      const insert = JSON.parse(options.body);
      assert.match(insert.reg_id, /^TH26-ADMIN-/);
      assert.equal(Object.hasOwn(insert, 'created_at'), false);
      rows.set(insert.reg_id, { ...insert, id: 'new-row', created_at: '2026-10-22T00:00:00Z' });
      return Response.json([rows.get(insert.reg_id)]);
    }
    if (url.includes('reg_id=eq.')) {
      const id = new URL(url).searchParams.get('reg_id').slice(3);
      return Response.json(rows.has(id) ? [rows.get(id)] : []);
    }
    return Response.json([...rows.values()]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'test-admin' }) })).json();
    const update = body => fetch(base + '/api/registrations/KEEP', { method: 'PUT', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
    assert.equal(writes, 0);
    assert.equal((await fetch(base + '/api/registrations/KEEP', { method: 'PUT', body: JSON.stringify({ record: source, expected: source }) })).status, 401);
    assert.equal((await update({ record: { ...source, mobile: 'bad' }, expected: source })).status, 400);
    assert.equal((await update({ record: source, expected: { ...source, rrn: 'stale' } })).status, 409);
    assert.equal(writes, 0);
    const corrected = { ...source, selected_events: ['fifa'] };
    const result = await update({ record: corrected, expected: source });
    assert.equal(result.status, 200);
    assert.deepEqual(rows.get('KEEP').selected_events, ['fifa']);
    assert.equal(rows.get('KEEP').created_at, source.created_at);
    assert.deepEqual(rows.get('OTHER').selected_events, ['game-craft', 'fifa']);
    concurrent = true;
    assert.equal((await update({ record: corrected, expected: corrected })).status, 409);
    const creation = { ...source, selected_events: ['game-craft'], request_id: '0123456789abcdef0123456789abcdef' };
    const create = body => fetch(base + '/api/admin/registrations', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
    const created = await create(creation);
    assert.equal(created.status, 201);
    assert.notEqual((await created.json()).data.reg_id, 'KEEP');
    assert.equal(rows.size, 3);
    assert.deepEqual(rows.get('KEEP').selected_events, ['fifa']);
    const writesBeforeRetry = writes;
    assert.equal((await create(creation)).status, 200);
    assert.equal(writes, writesBeforeRetry);
    assert.equal(rows.size, 3);
    assert.equal((await create({ ...creation, rrn: 'different' })).status, 409);
    assert.equal(writes, writesBeforeRetry);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('update guards escape text and preserve JSONB snapshots', () => {
  const params = new URLSearchParams(registrationUpdateFilter({ ...source, name: 'A "B" & C', section: null }));
  assert.equal(params.get('name'), 'eq.' + JSON.stringify('A "B" & C'));
  assert.equal(params.get('section'), 'is.null');
  assert.equal(params.get('team_members'), 'eq.[]');
});

test('admin edits and creation preserve sections on the legacy schema without migrations', async () => {
  const { section, ...fields } = source;
  let stored = { ...fields, team_members: { members: [], registrant_section: section } };
  let created;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test-admin' }, async (url, options) => {
    if (options.method === 'PATCH') {
      const patch = JSON.parse(options.body);
      assert.equal(Object.hasOwn(patch, 'section'), false);
      assert.deepEqual(patch.team_members, { members: [], registrant_section: 'A' });
      stored = { ...stored, ...patch };
      return Response.json([stored]);
    }
    if (options.method === 'POST') {
      const row = JSON.parse(options.body);
      if (Object.hasOwn(row, 'section')) return Response.json({ code: 'PGRST204', message: "Could not find the 'section' column" }, { status: 400 });
      assert.equal(row.team_members.registrant_section, 'A');
      created = { ...row, created_at: '2026-10-22T00:00:00Z' };
      return Response.json([created]);
    }
    if (url.includes('TH26-ADMIN-')) return Response.json(created ? [created] : []);
    return Response.json([stored]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'test-admin' }) })).json();
    const headers = { Authorization: 'Bearer ' + token };
    const response = await fetch(base + '/api/registrations/KEEP', { method: 'PUT', headers, body: JSON.stringify({ record: { ...source, selected_events: ['fifa'] }, expected: source }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.section, 'A');
    assert.equal(stored.created_at, source.created_at);
    const createdResponse = await fetch(base + '/api/admin/registrations', { method: 'POST', headers, body: JSON.stringify({ ...source, request_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) });
    assert.equal(createdResponse.status, 201);
    const normalized = (await createdResponse.json()).data;
    assert.equal(normalized.section, 'A');
    assert.deepEqual(normalized.team_members, []);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
