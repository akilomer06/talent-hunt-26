import { TEAM_RULES, normalizeRrn, type EventTeammate } from './registrationRules.ts';

export interface ParticipationRecord {
  reg_id: string;
  rrn: string;
  selected_events: string[];
  team_members?: EventTeammate[] | { members?: EventTeammate[] };
}

/** Read legacy JSON metadata without changing the source record. */
export function assignedMembers(record: ParticipationRecord) {
  const members = Array.isArray(record.team_members) ? record.team_members : record.team_members?.members || [];
  const selected = record.selected_events || [];
  const teamEvents = selected.filter(id => (TEAM_RULES[id]?.max || 1) > 1);
  const slots = new Map<string, number>();
  return members.filter(Boolean).map((member, index) => {
    const explicit = member.event_id && selected.includes(member.event_id) ? member.event_id : undefined;
    const inferred = !Object.hasOwn(member, 'event_id') && teamEvents.length === 1 ? teamEvents[0] : undefined;
    const eventId = explicit || inferred;
    const slot = eventId ? (slots.get(eventId) || 0) + 1 : 0;
    if (eventId) slots.set(eventId, slot);
    return { member, index, eventId, possibleEvents: eventId ? [eventId] : (teamEvents.length ? teamEvents : selected),
      role: eventId === 'bgmi' && slot === 4 ? 'Substitute' : 'Teammate', inferred: !explicit };
  });
}

/** Ambiguous historical assignments reserve possible events until an admin resolves them. */
export function eventRrnClaims(record: ParticipationRecord) {
  const claims = new Map<string, Set<string>>();
  const add = (event: string, rrn: string) => {
    if (typeof rrn !== 'string' || !normalizeRrn(rrn)) return;
    if (!claims.has(event)) claims.set(event, new Set());
    claims.get(event)!.add(normalizeRrn(rrn));
  };
  for (const id of record.selected_events || []) add(id, record.rrn);
  for (const assignment of assignedMembers(record)) for (const id of assignment.possibleEvents) add(id, assignment.member.rrn);
  return claims;
}

export function participationIndex(records: ParticipationRecord[]) {
  const index = new Map<string, Set<string>>();
  for (const record of records) for (const [event, rrns] of eventRrnClaims(record)) for (const rrn of rrns) {
    if (!index.has(rrn)) index.set(rrn, new Set());
    index.get(rrn)!.add(event);
  }
  return index;
}

/** Personal-detail corrections must not force removal of historical membership. */
export function sameParticipationShape(a: ParticipationRecord, b: ParticipationRecord) {
  const shape = (record: ParticipationRecord) => JSON.stringify({
    registrant: normalizeRrn(record.rrn), events: [...record.selected_events].sort(),
    members: assignedMembers(record).map(a => [normalizeRrn(a.member.rrn || ''), [...a.possibleEvents].sort(), a.role]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  });
  return shape(a) === shape(b);
}
