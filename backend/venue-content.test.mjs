import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.mjs';
import { EVENT_VENUES } from '../shared/eventVenues.ts';

test('public event content serves final venues without writing to the database', async () => {
  const stored = Object.keys(EVENT_VENUES).map(id => ({ id, venue: 'Old room', overview: 'Saved event details' }));
  let writes = 0;
  const server = createApiServer({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test', ADMIN_PASSCODE: 'admin' }, async (_url, options) => {
    if (['POST', 'PATCH', 'DELETE'].includes(options.method)) writes++;
    return Response.json([{ key: 'events', value: stored }, { key: 'settings', value: { venueName: 'Campus' } }]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/content`);
    assert.equal(response.status, 200);
    const rows = await response.json();
    for (const event of rows[0].value) {
      assert.equal(event.venue, EVENT_VENUES[event.id]);
      assert.equal(event.overview, 'Saved event details');
    }
    assert.deepEqual(rows[1].value, { venueName: 'Campus' });
    assert.equal(writes, 0);
    assert.ok(stored.every(event => event.venue === 'Old room'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
