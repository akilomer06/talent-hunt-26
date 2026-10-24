import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenRegistrationTestServer as createApiServer } from './open-registration-test-helper.mjs';
import { matchesPostgrestFilter } from './postgrest-test-helper.mjs';

const person = rrn => ({ name: 'Sample "Player", A & B', rrn, mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: '' });

test('smaller public teams and admin teammate removals persist, including the legacy database shape', async () => {
  const source = { ...person('001'), reg_id: 'BGMI-EXISTING', selected_events: ['bgmi'], team_members: { members: ['002', '003', '004', '005'].map(rrn => ({ ...person(rrn), event_id: 'bgmi' })), registrant_section: 'A' } };
  delete source.section;
  const rows = [structuredClone(source)];
  const server = createApiServer({ SUPABASE_URL: 'https://teams.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (url, options) => {
    const params = new URL(url).searchParams;
    if (options.method === 'POST') { const record = JSON.parse(options.body); rows.push(record); return new Response(null, { status: 201 }); }
    const matches = rows.filter(row => matchesPostgrestFilter(row, params));
    if (options.method === 'PATCH') {
      const patch = JSON.parse(options.body);
      assert.equal(Object.hasOwn(patch, 'section'), false);
      for (const row of matches) Object.assign(row, patch);
    }
    return Response.json(matches);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [i, event] of ['code-break', 'binary-battle', 'prompt-pop', 'clue-code', 'bgmi', 'valorant'].entries()) {
      const response = await fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify({ ...person('SOLO' + i), reg_id: 'SOLO-' + i, selected_events: [event], team_members: [] }) });
      assert.equal(response.status, 201, event);
    }
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'admin' }) })).json();
    const headers = { Authorization: 'Bearer ' + token };
    const roster = () => fetch(base + '/api/registrations', { headers }).then(response => response.json());
    const expected = (await roster()).find(row => row.reg_id === source.reg_id);
    const draft = { ...expected, name: 'Updated "Player", C & D', team_members: [] };
    const response = await fetch(base + '/api/registrations/' + source.reg_id, { method: 'PUT', headers, body: JSON.stringify({ record: draft, expected }) });
    assert.equal(response.status, 200);
    const refreshed = await roster();
    assert.equal(refreshed.length, 7);
    const updated = refreshed.find(row => row.reg_id === source.reg_id);
    assert.equal(updated.name, draft.name);
    assert.equal(updated.section, 'A');
    assert.deepEqual(updated.team_members, []);
    assert.equal(refreshed.filter(row => row.reg_id.startsWith('SOLO-')).length, 6);
    const stale = await fetch(base + '/api/registrations/' + source.reg_id, { method: 'PUT', headers, body: JSON.stringify({ record: expected, expected }) });
    assert.equal(stale.status, 409);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
