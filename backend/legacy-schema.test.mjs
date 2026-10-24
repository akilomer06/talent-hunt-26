import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenRegistrationTestServer as createApiServer } from './open-registration-test-helper.mjs';

test('legacy schema saves registrations and preserves sections and team members', async () => {
  const stored = [];
  const server = createApiServer({
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test',
  }, async (url, options) => {
    if (options.method === 'POST') {
      const record = JSON.parse(options.body);
      if ('section' in record) return Response.json({ code: 'PGRST204', message: "Could not find the 'section' column of 'registrations' in the schema cache" }, { status: 400 });
      stored.push(record);
      return new Response(null, { status: 201 });
    }
    return Response.json(stored);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const record = { reg_id: 'TEST', name: 'Test', rrn: '123', mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'B', selected_events: ['code-canvas'], team_members: [{ event_id: 'code-canvas', name: 'Teammate', rrn: '456', mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A' }] };
  try {
    const response = await fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify(record) });
    assert.equal(response.status, 201);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].team_members.registrant_section, 'B');
    assert.deepEqual(stored[0].team_members.members, record.team_members);
    const noSection = await fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify({ ...record, reg_id: 'TEST-NO-SECTION', rrn: '789', section: '', team_members: [] }) });
    assert.equal(noSection.status, 201);
    assert.deepEqual(stored[1].team_members, []);
    const login = await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'test' }) });
    const { token } = await login.json();
    const rows = await (await fetch(base + '/api/registrations', { headers: { Authorization: 'Bearer ' + token } })).json();
    assert.equal(rows[0].section, 'B');
    assert.deepEqual(rows[0].team_members, record.team_members);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
