import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { assertUniqueEventRrns, eventRrnClaims } from './registration-uniqueness.mjs';

const person = rrn => ({ name: 'Test', rrn, mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE' });
const registration = (id, rrn, teammates = [], event = 'code-canvas') => ({ ...person(rrn), reg_id: id, selected_events: [event], team_members: teammates.map(value => ({ ...person(value), event_id: event })) });

test('event uniqueness blocks all registrant/teammate combinations, including simultaneous requests', async () => {
  const rows = [registration('EXISTING', '001', ['002'])];
  let writes = 0;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test-admin' }, async (url, options) => {
    if (options.method === 'POST') {
      await new Promise(resolve => setTimeout(resolve, 15));
      writes++; rows.push(JSON.parse(options.body));
      return new Response(null, { status: 201 });
    }
    return Response.json(rows);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const submit = record => fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify(record) });
  try {
    for (const entry of [registration('A', '0 0 1'), registration('B', '002'), registration('C', '003', ['001']), registration('D', '003', ['002'])]) {
      const response = await submit(entry);
      assert.equal(response.status, 409);
      assert.match((await response.json()).error, /Vijay Hari.*733 898 5189/);
    }
    assert.equal(writes, 0);
    assert.equal((await submit(registration('DIFFERENT-EVENT', '001', [], 'fifa'))).status, 201);
    const responses = await Promise.all([submit(registration('RACE-1', '009')), submit(registration('RACE-2', '009'))]);
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    assert.equal(rows.filter(r => r.rrn === '009').length, 1);
    assert.equal(writes, 2);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('uniqueness checks include later database pages and legacy teammate metadata', async () => {
  let pages = 0;
  const database = async url => {
    pages++;
    if (url.includes('offset=0')) return Array.from({ length: 1000 }, (_, i) => registration('R' + i, 'X' + i));
    return [{ ...registration('LEGACY', '900'), team_members: { members: [person('a b c')], registrant_section: 'A' } }];
  };
  await assert.rejects(assertUniqueEventRrns(database, registration('NEW', 'ABC')), error => error.status === 409);
  assert.equal(pages, 2);
  const claims = eventRrnClaims({ ...registration('OLD', '001'), selected_events: ['code-canvas', 'trashion'], team_members: [person('002')] });
  assert.ok(claims.get('code-canvas').has('002'));
  assert.ok(claims.get('trashion').has('002'));
});

test('admin edits allow retained legacy claims but reject newly introduced event conflicts', async () => {
  const original = registration('ORIGINAL', '001');
  const database = async () => [original, registration('OTHER', '001'), registration('TAKEN', '999')];
  await assertUniqueEventRrns(database, { ...original, name: 'Corrected name' }, original);
  await assertUniqueEventRrns(database, { ...original, selected_events: ['fifa'] }, original);
  await assert.rejects(assertUniqueEventRrns(database, { ...original, rrn: '999' }, original), error => error.status === 409);
});

test('database-trigger conflicts return a safe duplicate message and help contact', async () => {
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test-admin' }, async (_url, options) => options.method === 'POST'
    ? Response.json({ code: 'P0001', message: 'TH26_DUPLICATE_EVENT_RRN: blocked' }, { status: 400 }) : Response.json([]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/registrations`, { method: 'POST', body: JSON.stringify(registration('A', '001')) });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /Vijay Hari/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
