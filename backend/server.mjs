import { createServer } from 'node:http';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createAccessStore } from './access.mjs';
import { validateEventTeams, closedRegistrationError } from '../shared/registrationRules.ts';
import { normalizeRegistration, validateAdminRegistration, sameRegistrationSnapshot, registrationUpdateFilter } from './registration-admin.mjs';
import { assertUniqueEventRrns, withRegistrationWrite, lookupParticipation } from './registration-uniqueness.mjs';
import { REGISTRATION_HELP } from '../shared/registrationRules.ts';

export function createApiServer(env = process.env, request = fetch) {
  const origins = (env.FRONTEND_URL || 'http://127.0.0.1:3000,http://localhost:3000').split(',').map(s => s.trim());
  const secret = env.SESSION_SECRET || randomBytes(32).toString('hex');
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.ADMIN_PASSCODE) {
    throw new Error('Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and ADMIN_PASSCODE in backend/.env.local or Render.');
  }
  const sign = value => createHmac('sha256', secret).update(value).digest('hex');
  const equal = (a, b) => {
    const left = Buffer.from(a || '');
    const right = Buffer.from(b || '');
    return left.length === right.length && timingSafeEqual(left, right);
  };
  const attempts = new Map();
  const lookupAttempts = new Map();
  async function database(path, options = {}) {
    const response = await request(`${env.SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY,
        ...(env.SUPABASE_SECRET_KEY?.startsWith('eyJ') ? { Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` } : {}),
        'Content-Type': 'application/json', ...options.headers,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const raw = await response.text();
      let problem;
      try { problem = JSON.parse(raw); } catch { problem = {}; }
      console.error('Supabase request failed:', response.status, problem.code || 'unknown');
      if (problem.code === 'P0001' && problem.message?.startsWith('TH26_DUPLICATE_EVENT_RRN')) throw Object.assign(new Error(`An RRN is already registered for one of the selected events as registrant or teammate. ${REGISTRATION_HELP}`), { status: 409 });
      if (problem.code === 'P0001' && problem.message?.startsWith('TH26_EVENT_LIMIT')) throw Object.assign(new Error(`A participant has reached the event limit: maximum two events, one Technical and one Non-Technical, including teammates and substitutes. ${REGISTRATION_HELP}`), { status: 409 });
      throw Object.assign(new Error('Database request failed'), {
        status: 502, code: problem.code, databaseMessage: problem.message,
      });
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  const access = createAccessStore(database, secret, env.REGISTRATION_TEAM_PASSCODE);
  async function registrationSetupError() {
    if (!env.SESSION_SECRET) return 'Set a stable SESSION_SECRET on Render before configuring registration-team access.';
    if (!env.SUPABASE_SECRET_KEY) return 'Set SUPABASE_SECRET_KEY on Render and apply backend/secure-policies.sql before enabling team access.';
    for (const table of ['registrations', 'site_content']) {
      const probe = await request(env.SUPABASE_URL + '/rest/v1/' + table + '?select=*&limit=0', {
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY }, signal: AbortSignal.timeout(15000),
      });
      if (![401, 403].includes(probe.status)) return 'Apply backend/secure-policies.sql in Supabase first. The database still permits public access.';
    }
    return null;
  }
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Vary', 'Origin');
    res.setHeader('Cache-Control', 'no-store');
    const reply = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    if (origin && !origins.includes(origin)) return reply(403, { error: 'Origin is not allowed' });
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const path = new URL(req.url, 'http://localhost').pathname;
    try {
      let body;
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 1024 * 1024) return reply(413, { error: 'Request too large' });
        }
        if (raw.trim() || req.method !== 'DELETE') {
          try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Invalid JSON' }); }
        }
      }
      if (path === '/api/health' && req.method === 'GET') {
        // A real, read-only database query; never return the content or write a row.
        await database('site_content?select=key&limit=1', { method: 'GET' });
        return reply(200, { status: 'ok', database: 'connected' });
      }
      if (['/api/admin/login', '/api/adminregistration/login'].includes(path) && req.method === 'POST') {
        const role = path === '/api/adminregistration/login' ? 'registration' : 'admin';
        const ip = req.socket.remoteAddress;
        const attemptKey = role + ':' + ip;
        const now = Date.now();
        for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
        const attempt = attempts.get(attemptKey) || { count: 0, until: now + 60000 };
        if (attempt.count >= 10) {
          const retryAfter = Math.max(1, Math.ceil((attempt.until - now) / 1000));
          res.setHeader('Retry-After', String(retryAfter));
          return reply(429, { error: `Too many ${role === 'admin' ? 'main-admin' : 'registration-team'} login attempts. Try again in ${retryAfter} seconds.` });
        }
        attempt.count++;
        attempts.set(attemptKey, attempt);
        if (typeof body?.passcode !== 'string' || body.passcode.length > 200) return reply(401, { error: 'Incorrect passcode' });
        if (role === 'registration') {
          const setupError = await registrationSetupError();
          if (setupError) return reply(503, { error: setupError });
        }
        const version = role === 'registration' ? await access.login(body.passcode) : '';
        if (role === 'admin' && !equal(body.passcode, env.ADMIN_PASSCODE)) return reply(401, { error: 'Incorrect main-admin passcode' });
        if (role === 'registration' && !version) return reply(401, { error: 'Incorrect registration-team passcode or team access is disabled' });
        attempts.delete(attemptKey);
        const payload = Buffer.from(JSON.stringify({ role, exp: now + 8 * 60 * 60 * 1000, version })).toString('base64url');
        return reply(200, { token: payload + '.' + sign(payload), role });
      }
      if (path === '/api/content' && req.method === 'GET') return reply(200, await database('site_content?select=*&key=in.(events,settings)'));
      if (path === '/api/participation' && req.method === 'POST') {
        if (!Array.isArray(body?.rrns) || body.rrns.length < 1 || body.rrns.length > 21 || !body.rrns.every(rrn => typeof rrn === 'string' && rrn.length <= 200 && rrn.trim())) return reply(400, { error: 'Enter valid RRNs to check participation.' });
        const now = Date.now();
        for (const [key, value] of lookupAttempts) if (value.until < now) lookupAttempts.delete(key);
        const key = req.socket.remoteAddress;
        const attempt = lookupAttempts.get(key) || { count: 0, until: now + 60000 };
        if (attempt.count >= 120) { res.setHeader('Retry-After', String(Math.max(1, Math.ceil((attempt.until - now) / 1000)))); return reply(429, { error: 'Too many participation checks. Please wait a minute.' }); }
        attempt.count++; lookupAttempts.set(key, attempt);
        return reply(200, { participation: await lookupParticipation(database, body.rrns) });
      }
      if (path === '/api/registrations' && req.method === 'POST') {
        return await withRegistrationWrite(env.SUPABASE_URL, async () => {
          const fields = ['reg_id', 'name', 'rrn', 'mobile', 'programme', 'year', 'department'];
          if (!fields.every(key => typeof body?.[key] === 'string' && body[key].trim().length > 0 && body[key].length <= 200)
            || !Array.isArray(body.selected_events) || body.selected_events.length < 1 || body.selected_events.length > 2
            || !body.selected_events.every(value => typeof value === 'string' && value.length <= 100)
            || !Array.isArray(body.team_members) || body.team_members.length > 20) return reply(400, { error: 'Invalid registration details' });
          const closureError = closedRegistrationError(body.selected_events);
          if (closureError) return reply(409, { error: closureError });
          const teamError = validateEventTeams(body.selected_events, body.team_members, body.rrn);
          if (teamError) return reply(400, { error: teamError });
          const record = Object.fromEntries(fields.map(key => [key, body[key].trim()]));
          Object.assign(record, { section: typeof body.section === 'string' ? body.section.slice(0, 100) : '', selected_events: body.selected_events, team_members: body.team_members });
          await assertUniqueEventRrns(database, record);
          const insert = value => database('registrations', { method: 'POST', body: JSON.stringify(value), headers: { Prefer: 'return=minimal' } });
          try {
            await insert(record);
          } catch (error) {
            // Older projects have JSONB team_members but no section column. The
            // rejected insert wrote nothing, so retry with lossless JSON metadata.
            if (error.code !== 'PGRST204' || !error.databaseMessage?.includes("'section'")) throw error;
            const { section, ...legacy } = record;
            if (section) legacy.team_members = { members: record.team_members, registrant_section: section };
            await insert(legacy);
          }
          return reply(201, { success: true, data: record });
        });
      }
      const parts = (req.headers.authorization?.replace(/^Bearer /, '') || '').split('.');
      let session;
      try {
        if (parts.length !== 2 || !equal(parts[1], sign(parts[0]))) throw new Error();
        session = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        if (!['admin', 'registration'].includes(session.role) || !Number.isFinite(session.exp) || session.exp < Date.now()) throw new Error();
      } catch { return reply(401, { error: 'Please sign in to the correct admin portal' }); }
      if (session.role === 'registration') {
        const current = await access.read();
        if (!current.enabled || !equal(session.version, current.version)) return reply(401, { error: 'Registration-team access has been revoked. Contact the main administrator.' });
        if (req.method !== 'GET' || !['/api/registrations', '/api/admin/session'].includes(path)) return reply(403, { error: 'This portal has read-only registration access' });
      }
      if (path === '/api/admin/session' && req.method === 'GET') return reply(200, { role: session.role });
      if (path === '/api/admin/registrations' && req.method === 'POST') {
        return await withRegistrationWrite(env.SUPABASE_URL, async () => {
          const record = validateAdminRegistration(body);
          if (typeof body.request_id !== 'string' || !/^[a-f0-9]{32}$/i.test(body.request_id)) return reply(400, { error: 'Invalid creation request. Reopen the registration draft.' });
          const regId = 'TH26-ADMIN-' + body.request_id.toUpperCase();
          const findExisting = () => database(`registrations?reg_id=eq.${encodeURIComponent(regId)}&select=*&limit=1`);
          const existing = await findExisting();
          if (existing?.length) return sameRegistrationSnapshot(existing[0], record) ? reply(200, { success: true, data: normalizeRegistration(existing[0]) }) : reply(409, { error: 'This draft was already saved with different details. Refresh registrations before creating another pass.' });
          const closureError = closedRegistrationError(record.selected_events);
          if (closureError) return reply(409, { error: closureError });
          await assertUniqueEventRrns(database, record);
          const inserted = await database('registrations', { method: 'POST', body: JSON.stringify({ ...record, reg_id: regId }), headers: { Prefer: 'return=representation' } }).catch(async error => {
            if (error.code === '23505') return findExisting();
            if (error.code !== 'PGRST204' || !error.databaseMessage?.includes("'section'")) throw error;
            const { section, ...legacy } = record;
            return database('registrations', { method: 'POST', body: JSON.stringify({ ...legacy, reg_id: regId, team_members: { members: record.team_members, registrant_section: section } }), headers: { Prefer: 'return=representation' } });
          });
          if (!Array.isArray(inserted) || inserted.length !== 1) return reply(502, { error: 'The database did not confirm the new registration. Refresh before retrying.' });
          if (!sameRegistrationSnapshot(inserted[0], record)) return reply(409, { error: 'This draft was already saved with different details. Refresh registrations.' });
          return reply(201, { success: true, data: normalizeRegistration(inserted[0]) });
        });
      }
      if (path.startsWith('/api/registrations/') && req.method === 'PUT') {
        return await withRegistrationWrite(env.SUPABASE_URL, async () => {
          const regId = decodeURIComponent(path.slice('/api/registrations/'.length));
          if (!regId || regId.length > 200) return reply(400, { error: 'Invalid registration ID' });
          const found = await database(`registrations?reg_id=eq.${encodeURIComponent(regId)}&select=*&limit=1`);
          if (!found?.length) return reply(404, { error: 'Registration no longer exists. Refresh the list.' });
          const original = found[0];
          const record = validateAdminRegistration(body?.record, original);
          if (!sameRegistrationSnapshot(original, body.expected)) return reply(409, { error: 'This registration changed since you opened it. Refresh and review the latest details before saving.' });
          const closureError = closedRegistrationError(record.selected_events, original.selected_events);
          if (closureError) return reply(409, { error: closureError });
          await assertUniqueEventRrns(database, record, original);
          let patch = record;
          if (!Object.hasOwn(original, 'section')) {
            const { section, ...legacy } = record;
            patch = { ...legacy, team_members: { members: record.team_members, registrant_section: section } };
          }
          const updated = await database(`registrations?${registrationUpdateFilter(original)}&select=*`, { method: 'PATCH', body: JSON.stringify(patch), headers: { Prefer: 'return=representation' } });
          if (!Array.isArray(updated) || updated.length !== 1) return reply(409, { error: 'This registration changed during the update. Refresh and review it again.' });
          if (!sameRegistrationSnapshot(updated[0], record)) return reply(409, { error: 'The database did not confirm the requested changes. Refresh and review the record before retrying.' });
          return reply(200, { success: true, data: normalizeRegistration(updated[0]) });
        });
      }
      if (path === '/api/admin/access' && req.method === 'GET') return reply(200, access.status(await access.read()));
      if (path === '/api/admin/access' && req.method === 'PUT') {
        if (body?.enabled) {
          const setupError = await registrationSetupError();
          if (setupError) return reply(503, { error: setupError });
        }
        try { return reply(200, await access.save(body)); }
        catch (error) { if (error.status === 400) return reply(400, { error: error.message }); throw error; }
      }
      if (path === '/api/registrations' && req.method === 'GET') {
        const rows = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const page = await database(`registrations?select=*&order=created_at.desc,id.desc&limit=${pageSize}&offset=${offset}`);
          rows.push(...page);
          if (page.length < pageSize) break;
        }
        return reply(200, rows.map(row => {
          const metadata = row.team_members;
          if (metadata && !Array.isArray(metadata) && Array.isArray(metadata.members)) {
            return { ...row, section: row.section || metadata.registrant_section || '', team_members: metadata.members };
          }
          return row;
        }));
      }
      if (path.startsWith('/api/registrations/') && req.method === 'DELETE') {
        return await withRegistrationWrite(env.SUPABASE_URL, async () => {
          const regId = decodeURIComponent(path.slice('/api/registrations/'.length));
          if (!regId || regId.length > 200) return reply(400, { error: 'Invalid registration ID' });
          const found = await database(`registrations?reg_id=eq.${encodeURIComponent(regId)}&select=*&limit=1`);
          if (!Array.isArray(found) || found.length !== 1) return reply(404, { error: 'Registration no longer exists. Refresh the list.' });
          const original = found[0];
          if (body && Object.hasOwn(body, 'expected') && !sameRegistrationSnapshot(original, body.expected)) return reply(409, { error: 'This registration changed since you selected it. Refresh and review the latest details before deleting.' });
          const removed = await database(`registrations?${registrationUpdateFilter(original)}&select=reg_id`, {
            method: 'DELETE', headers: { Prefer: 'return=representation' },
          });
          if (!Array.isArray(removed) || removed.length !== 1 || removed[0].reg_id !== regId) return reply(409, { error: 'The database did not confirm this deletion. Refresh the list before retrying.' });
          return reply(200, { success: true, reg_id: regId });
        });
      }
      if (['/api/content/events', '/api/content/settings'].includes(path) && req.method === 'PUT') {
        if ((path.endsWith('/events') && !Array.isArray(body)) || (path.endsWith('/settings') && (!body || Array.isArray(body) || typeof body !== 'object'))) return reply(400, { error: 'Invalid content' });
        await database('site_content?on_conflict=key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ key: path.split('/').at(-1), value: body, updated_at: new Date().toISOString() }) });
        return reply(200, { success: true });
      }
      return reply(404, { error: 'Endpoint not found' });
    } catch (error) {
      if (![400, 409].includes(error.status)) console.error(error);
      return reply(error.status || 500, { error: [400, 409].includes(error.status) ? error.message : 'Unable to complete the request. Please try again.' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createApiServer();
  server.listen(Number(process.env.PORT || 4000), '0.0.0.0', () => console.log(`Talent Hunt API listening on port ${process.env.PORT || 4000}`));
}
