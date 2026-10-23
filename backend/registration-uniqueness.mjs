import { TEAM_RULES, normalizeRrn, REGISTRATION_HELP } from '../shared/registrationRules.ts';
import { normalizeRegistration } from './registration-admin.mjs';
import { eventRrnClaims, participationIndex, assignedMembers } from '../shared/participation.ts';
export { eventRrnClaims } from '../shared/participation.ts';

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

export async function readParticipationRecords(database) {
  const records = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = await database(`registrations?select=reg_id,rrn,selected_events,team_members&order=reg_id.asc&limit=1000&offset=${offset}`);
    if (!Array.isArray(rows)) throw new Error('Unable to check event registrations');
    records.push(...rows.map(normalizeRegistration));
    if (rows.length < 1000) return records;
  }
}

// Public lookup deliberately exposes only event associations, never names,
// phones, pass IDs, or the other people on a team.
export async function lookupParticipation(database, rrns) {
  const requested = new Set(rrns.map(normalizeRrn));
  const result = Object.fromEntries([...requested].map(rrn => [rrn, []]));
  const add = (rrn, id, role, uncertain = false) => {
    rrn = normalizeRrn(rrn || '');
    if (!requested.has(rrn)) return;
    let item = result[rrn].find(event => event.id === id);
    if (!item) { item = { id, title: TEAM_RULES[id]?.title || id, category: TEAM_RULES[id]?.category || 'unknown', roles: [], uncertain: false }; result[rrn].push(item); }
    if (!item.roles.includes(role)) item.roles.push(role);
    item.uncertain ||= uncertain;
  };
  for (const record of await readParticipationRecords(database)) {
    for (const id of record.selected_events) add(record.rrn, id, 'Registrant');
    for (const assignment of assignedMembers(record)) for (const id of assignment.possibleEvents) add(assignment.member.rrn, id, assignment.role, !assignment.eventId);
  }
  return result;
}

export async function assertUniqueEventRrns(database, proposed, original) {
  const incoming = eventRrnClaims(proposed);
  const old = original ? eventRrnClaims(original) : new Map();
  // Existing duplicates remain available for manual correction. An unchanged
  // event/RRN on an edited pass does not introduce a new duplicate.
  for (const [id, rrns] of incoming) for (const value of rrns) if (old.get(id)?.has(value)) rrns.delete(value);
  if (![...incoming.values()].some(rrns => rrns.size)) return;
  const conflicts = new Set();
  const rows = (await readParticipationRecords(database)).filter(row => !original || row.reg_id !== original.reg_id);
  for (const row of rows) for (const [eventId, rrns] of eventRrnClaims(row)) for (const value of rrns) {
    if (incoming.get(eventId)?.has(value)) conflicts.add(`${TEAM_RULES[eventId]?.title || eventId}: RRN ${value}`);
  }
  if (conflicts.size) throw Object.assign(new Error(`${[...conflicts].join('; ')} already registered for this event as registrant or teammate/substitute. Each RRN can join an event only once. ${REGISTRATION_HELP}`), { status: 409 });
  const all = participationIndex([...rows, proposed]);
  const changedRrns = new Set([...incoming.values()].flatMap(rrns => [...rrns]));
  for (const rrn of changedRrns) {
    const events = [...(all.get(rrn) || [])];
    const categories = events.map(id => TEAM_RULES[id]?.category).filter(Boolean);
    if (events.length > 2 || categories.filter(c => c === 'technical').length > 1 || categories.filter(c => c === 'non-technical').length > 1) {
      throw Object.assign(new Error(`RRN ${rrn} has reached the event limit. Each participant may join a maximum of two events: one Technical and one Non-Technical, including as teammate or substitute. Associated events: ${events.map(id => TEAM_RULES[id]?.title || id).join(', ')}. ${REGISTRATION_HELP}`), { status: 409 });
    }
  }
}
