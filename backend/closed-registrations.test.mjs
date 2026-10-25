import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { TEAM_RULES } from '../shared/registrationRules.ts';

test('all 16 events reject public and admin creation before any database write', async () => {
  let writes = 0;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'test-admin' }, async (_url, options) => {
    if (['POST', 'PATCH', 'DELETE'].includes(options.method)) writes++;
    return Response.json([]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const person = { name: 'Test', rrn: '001', mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE' };
  try {
    const { token } = await (await fetch(base + '/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode: 'test-admin' }) })).json();
    for (const event of Object.keys(TEAM_RULES)) {
      const body = { ...person, reg_id: 'TEST', selected_events: [event], team_members: event === 'bid-wars' ? [{ ...person, rrn: '002', event_id: event }] : [], request_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
      const publicResult = await fetch(base + '/api/registrations', { method: 'POST', body: JSON.stringify(body) });
      assert.equal(publicResult.status, 409);
      assert.match((await publicResult.json()).error, /Online registration is closed for this event/);
      const adminResult = await fetch(base + '/api/admin/registrations', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
      assert.equal(adminResult.status, 409);
      assert.match((await adminResult.json()).error, /On-the-spot registration may be available/);
    }
    assert.equal(writes, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
