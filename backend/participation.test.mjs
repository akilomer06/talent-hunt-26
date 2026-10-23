import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { assertUniqueEventRrns, lookupParticipation } from './registration-uniqueness.mjs';
import { validateAdminRegistration } from './registration-admin.mjs';

const person = rrn => ({ name: 'Example', rrn, mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A' });
const record = (id, rrn, event, members = []) => ({ ...person(rrn), reg_id: id, selected_events: [event], team_members: members.map(r => ({ ...person(r), event_id: event })) });

test('limits apply to every registrant, teammate and BGMI substitute RRN, preserving leading zeros', async () => {
  const rows = [record('TECH', '001', 'code-canvas', ['002']), record('BGMI', '003', 'bgmi', ['004', '005', '006', '002'])];
  const before = JSON.stringify(rows);
  for (const proposed of [record('A', '0 0 2', 'shutter-verse'), record('B', '007', 'trashion', ['002']), record('C', '002', 'game-craft'), record('D', '001', 'tech-talks')]) {
    await assert.rejects(assertUniqueEventRrns(async () => rows, proposed), error => error.status === 409 && /event limit/.test(error.message));
  }
  await assertUniqueEventRrns(async () => rows, record('VALID', '001', 'trashion'));
  assert.equal(JSON.stringify(rows), before);
  const status = await lookupParticipation(async () => rows, ['0 0 2']);
  assert.deepEqual(status['002'].map(e => e.id), ['code-canvas', 'bgmi']);
  assert.deepEqual(status['002'][1].roles, ['Substitute']);
});

test('historical excess remains editable and reducible, but new participation and changed RRNs are checked', async () => {
  const original = record('ORIGINAL', '001', 'code-canvas');
  const rows = [original, record('SECOND', '001', 'trashion'), record('THIRD', '001', 'shutter-verse'), record('TAKEN', '999', 'tech-talks')];
  await assertUniqueEventRrns(async () => rows, { ...original, name: 'Corrected', mobile: '9000000001' }, original);
  await assert.rejects(assertUniqueEventRrns(async () => rows, { ...original, selected_events: ['neural-nexus'] }, original), /event limit/);
  await assert.rejects(assertUniqueEventRrns(async () => rows, { ...original, rrn: '999' }, original), /event limit/);
  await assertUniqueEventRrns(async () => rows, { ...original, selected_events: [] }, original);
  assert.equal(rows.length, 4);
});

test('personal corrections can retain historical three-event forms without allowing modified participation to bypass rules', () => {
  const original = { ...record('LEGACY', '001', 'code-canvas'), selected_events: ['code-canvas', 'trashion', 'shutter-verse'] };
  const corrected = validateAdminRegistration({ ...original, name: 'Corrected name' }, original);
  assert.deepEqual(corrected.selected_events, original.selected_events);
  assert.throws(() => validateAdminRegistration({ ...original, rrn: 'NEW' }, original), /Select one or two events/);
  assert.throws(() => validateAdminRegistration(original), /Select one or two events/);
});

test('ambiguous legacy teammate assignments cannot bypass category or overall limits', async () => {
  const legacy = { ...record('OLD', '001', 'code-canvas'), selected_events: ['code-canvas', 'trashion'], team_members: { members: [person('002')] } };
  await assert.rejects(assertUniqueEventRrns(async () => [legacy], record('NEW', '002', 'shutter-verse')), /event limit/);
  const status = await lookupParticipation(async () => [legacy], ['002']);
  assert.ok(status['002'].every(e => e.uncertain));
});

test('public lookups are read-only, privacy limited, bounded, and fail closed on database errors', async () => {
  let writes = 0;
  let fail = false;
  const server = createApiServer({ SUPABASE_URL: 'https://lookup.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (_url, options) => {
    if (options.method && options.method !== 'GET') writes++;
    return fail ? Response.json({}, { status: 503 }) : Response.json([record('SECRET-PASS', '001', 'code-canvas', ['002'])]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const post = body => fetch(`http://127.0.0.1:${server.address().port}/api/participation`, { method: 'POST', body: JSON.stringify(body) });
  try {
    const response = await post({ rrns: ['001', '002', '003'] });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.participation['001'][0].id, 'code-canvas');
    assert.deepEqual(body.participation['003'], []);
    assert.ok(!JSON.stringify(body).includes('SECRET-PASS'));
    assert.ok(!JSON.stringify(body).includes('9000000000'));
    assert.ok(!JSON.stringify(body).includes('Example'));
    for (const invalid of [{ rrns: [] }, { rrns: [' '] }, { rrns: new Array(22).fill('001') }, { rrns: ['1'.repeat(201)] }]) assert.equal((await post(invalid)).status, 400);
    fail = true;
    assert.equal((await post({ rrns: ['001'] })).status, 502);
    assert.equal(writes, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('concurrent different-event submissions for one RRN cannot create two Technical events', async () => {
  const rows = [];
  const server = createApiServer({ SUPABASE_URL: 'https://race-category.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (_url, options) => {
    if (options.method === 'POST') { await new Promise(resolve => setTimeout(resolve, 10)); rows.push(JSON.parse(options.body)); return new Response(null, { status: 201 }); }
    return Response.json(rows);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const responses = await Promise.all(['code-canvas', 'game-craft'].map(event => fetch(`http://127.0.0.1:${server.address().port}/api/registrations`, { method: 'POST', body: JSON.stringify(record(event, '001', event)) })));
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    assert.equal(rows.length, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('admin creation and participation edits cannot bypass the global event limit', async () => {
  const original = record('ORIGINAL', '001', 'code-canvas');
  const rows = [original, record('SECOND', '001', 'trashion')];
  let writes = 0;
  const server = createApiServer({ SUPABASE_URL: 'https://admin-limit.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (url, options) => {
    if (['POST', 'PATCH', 'DELETE'].includes(options.method)) { writes++; return Response.json([]); }
    if (url.includes('reg_id=eq.ORIGINAL')) return Response.json([original]);
    if (url.includes('reg_id=eq.')) return Response.json([]);
    return Response.json(rows);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const login = await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'admin' }) });
    const { token } = await login.json();
    const headers = { Authorization: 'Bearer ' + token };
    const created = await fetch(base + '/api/admin/registrations', { method: 'POST', headers, body: JSON.stringify({ ...record('NEW', '002', 'the-voice-over', ['001']), request_id: 'a'.repeat(32) }) });
    assert.equal(created.status, 409);
    const edited = await fetch(base + '/api/registrations/ORIGINAL', { method: 'PUT', headers, body: JSON.stringify({ record: { ...original, selected_events: ['shutter-verse'] }, expected: original }) });
    assert.equal(edited.status, 409);
    assert.equal(writes, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
