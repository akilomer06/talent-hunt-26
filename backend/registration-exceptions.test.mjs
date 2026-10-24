import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { matchesPostgrestFilter } from './postgrest-test-helper.mjs';

for (const rrn of ['240181601070', '240071603001']) test(`FIFA exception for ${rrn} requires main admin and preserves closure, uniqueness and event limits`, async () => {
  const rows = new Map();
  let writes = 0;
  const server = createApiServer({
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', SUPABASE_SECRET_KEY: 'private',
    ADMIN_PASSCODE: 'main-test', REGISTRATION_TEAM_PASSCODE: 'team-test', SESSION_SECRET: 'stable-secret',
  }, async (url, options) => {
    if (options.headers.apikey === 'public') return new Response(null, { status: 403 });
    if (url.includes('/site_content')) return Response.json([]);
    if (options.method === 'POST') {
      writes++;
      const row = JSON.parse(options.body);
      rows.set(row.reg_id, row);
      return Response.json([row]);
    }
    if (options.method === 'PATCH') {
      const params = new URL(url).searchParams;
      const found = [...rows.values()].find(row => matchesPostgrestFilter(row, params));
      if (!found) return Response.json([]);
      writes++;
      const updated = { ...found, ...JSON.parse(options.body) };
      rows.set(found.reg_id, updated);
      return Response.json([updated]);
    }
    const regId = new URL(url).searchParams.get('reg_id')?.slice(3);
    return Response.json(regId ? (rows.has(regId) ? [rows.get(regId)] : []) : [...rows.values()]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, token) => fetch(base + path, { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: JSON.stringify(body) });
  const draft = { reg_id: 'UNTRUSTED', name: 'Test Student', rrn, mobile: '9000000000', programme: 'B.Tech', year: 'III', department: 'CSE', section: 'A', selected_events: ['fifa'], team_members: [], request_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
  try {
    const { token } = await (await post('/api/admin/login', { passcode: 'main-test' })).json();
    const { token: teamToken } = await (await post('/api/adminregistration/login', { passcode: 'team-test' })).json();
    assert.equal((await post('/api/admin/registration-exceptions', { rrn: draft.rrn })).status, 401);
    assert.equal((await post('/api/admin/registration-exceptions', { rrn: draft.rrn }, teamToken)).status, 403);
    assert.equal((await post('/api/admin/registrations', draft, teamToken)).status, 403);
    assert.equal((await post('/api/admin/registration-exceptions', { rrn: {} }, token)).status, 400);
    assert.deepEqual(await (await post('/api/admin/registration-exceptions', { rrn: draft.rrn }, token)).json(), { events: ['fifa'] });
    assert.deepEqual(await (await post('/api/admin/registration-exceptions', { rrn: 'OTHER' }, token)).json(), { events: [] });
    assert.equal((await post('/api/registrations', draft)).status, 409);
    assert.equal((await post('/api/admin/registrations', { ...draft, rrn: 'OTHER', exception: true }, token)).status, 409);
    assert.equal((await post('/api/admin/registrations', { ...draft, selected_events: ['bid-wars'] }, token)).status, 409);
    assert.equal(writes, 0);

    const otherEvent = { ...draft, reg_id: 'EXISTING', selected_events: ['bgmi'] };
    rows.set(otherEvent.reg_id, otherEvent);
    const limit = await post('/api/admin/registrations', draft, token);
    assert.equal(limit.status, 409);
    assert.match((await limit.json()).error, /event limit/);
    assert.equal(writes, 0);
    rows.clear();

    // Simultaneous drafts can create only one FIFA membership for this RRN.
    const responses = await Promise.all([
      post('/api/admin/registrations', draft, token),
      post('/api/admin/registrations', { ...draft, request_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }, token),
    ]);
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    assert.equal(writes, 1);
    assert.equal(rows.size, 1);
    const winningDraft = responses[0].status === 201 ? draft : { ...draft, request_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' };
    assert.equal((await post('/api/admin/registrations', winningDraft, token)).status, 200);
    assert.equal(writes, 1);

    // The same exception can add FIFA to an existing technical pass.
    rows.clear();
    const original = { ...draft, reg_id: 'KEEP', selected_events: ['tech-talks'] };
    rows.set(original.reg_id, original);
    const changed = { ...original, selected_events: ['tech-talks', 'fifa'] };
    const update = await fetch(base + '/api/registrations/KEEP', { method: 'PUT', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify({ record: changed, expected: original }) });
    assert.equal(update.status, 200);
    assert.deepEqual(rows.get('KEEP').selected_events, ['tech-talks', 'fifa']);
    const transfer = await fetch(base + '/api/registrations/KEEP', { method: 'PUT', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify({ record: { ...changed, rrn: 'OTHER' }, expected: changed }) });
    assert.equal(transfer.status, 409);
    assert.match((await transfer.json()).error, /Registration is closed for FIFA/);
    assert.equal(rows.get('KEEP').rrn, draft.rrn);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
