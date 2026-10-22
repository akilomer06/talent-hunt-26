import { TEAM_RULES, normalizeRrn, REGISTRATION_HELP } from '../shared/registrationRules.ts';
import { normalizeRegistration } from './registration-admin.mjs';

const queues = new Map();
/** Serialize checks and writes for every API server using the same database. */
export async function withRegistrationWrite(databaseUrl, operation) {
  const previous = queues.get(databaseUrl) || Promise.resolve();
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  queues.set(databaseUrl, pending);
  await previous;
  try { return await operation(); }
  finally { release(); if (queues.get(databaseUrl) === pending) queues.delete(databaseUrl); }
}

export function eventRrnClaims(raw) {
  const record = normalizeRegistration(raw);
  const claims = new Map();
  const add = (eventId, value) => {
    if (typeof value !== 'string' || !normalizeRrn(value)) return;
    if (!claims.has(eventId)) claims.set(eventId, new Set());
    claims.get(eventId).add(normalizeRrn(value));
  };
  const selected = Array.isArray(record.selected_events) ? record.selected_events : [];
  for (const id of selected) add(id, record.rrn);
  for (const member of record.team_members) {
    if (!member) continue;
    if (member.event_id && selected.includes(member.event_id)) add(member.event_id, member.rrn);
    else {
      // An older ambiguous teammate may belong to either team. Do not let an
      // unknown assignment silently permit another registration for that RRN.
      const possible = selected.filter(id => (TEAM_RULES[id]?.max || 1) > 1);
      for (const id of possible.length ? possible : selected) add(id, member.rrn);
    }
  }
  return claims;
}

export async function assertUniqueEventRrns(database, proposed, original) {
  const incoming = eventRrnClaims(proposed);
  const old = original ? eventRrnClaims(original) : new Map();
  // Existing duplicates remain available for manual correction. An unchanged
  // event/RRN on an edited pass does not introduce a new duplicate.
  for (const [id, rrns] of incoming) for (const value of rrns) if (old.get(id)?.has(value)) rrns.delete(value);
  if (![...incoming.values()].some(rrns => rrns.size)) return;
  const conflicts = new Set();
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const rows = await database(`registrations?select=reg_id,rrn,selected_events,team_members&order=reg_id.asc&limit=${pageSize}&offset=${offset}`);
    if (!Array.isArray(rows)) throw new Error('Unable to check event registrations');
    for (const row of rows) {
      if (original && row.reg_id === original.reg_id) continue;
      for (const [eventId, rrns] of eventRrnClaims(row)) for (const value of rrns) {
        if (incoming.get(eventId)?.has(value)) conflicts.add(`${TEAM_RULES[eventId]?.title || eventId}: RRN ${value}`);
      }
    }
    if (rows.length < pageSize) break;
  }
  if (conflicts.size) throw Object.assign(new Error(`${[...conflicts].join('; ')} already registered for this event as registrant or teammate. Each RRN can join an event only once. ${REGISTRATION_HELP}`), { status: 409 });
}
