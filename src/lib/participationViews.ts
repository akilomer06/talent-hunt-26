import { assignedMembers, participationIndex } from '../../shared/participation';
import { normalizeRrn, TEAM_RULES } from '../../shared/registrationRules';
import type { RegistrationRecord, TeamMember } from './supabase';

export interface GroupMember { person: TeamMember; role: string; memberIndex: number | null; assignment: string }
export interface EventGroup { id: string; eventId: string; record: RegistrationRecord; members: GroupMember[] }

/** Keep every source team, including historical duplicates; never merge teams by RRN. */
export function buildEventGroups(records: RegistrationRecord[]) {
  const events = new Map<string, EventGroup[]>();
  const unassigned: Array<{ record: RegistrationRecord; member: TeamMember; index: number; possibleEvents: string[] }> = [];
  for (const record of records) {
    const assignments = assignedMembers(record);
    for (const eventId of new Set(record.selected_events)) {
      const group: EventGroup = { id: `${record.reg_id}:${eventId}`, eventId, record, members: [
        { person: record, role: eventId === 'bgmi' ? 'Registrant · Main player' : 'Registrant', memberIndex: null, assignment: 'Selected event' },
        ...assignments.filter(a => a.eventId === eventId).map(a => ({ person: a.member,
          role: eventId === 'bgmi' && a.role !== 'Substitute' ? 'Teammate · Main player' : a.role,
          memberIndex: a.index, assignment: a.inferred ? 'Inferred from the only team event' : a.role === 'Substitute' ? 'Substitute inferred from BGMI fifth-player slot' : 'Explicit event assignment' })),
      ] };
      if (!events.has(eventId)) events.set(eventId, []);
      events.get(eventId)!.push(group);
    }
    for (const a of assignments) if (!a.eventId) unassigned.push({ record, member: a.member, index: a.index, possibleEvents: a.possibleEvents });
  }
  return { events, unassigned };
}

export function buildExcessParticipants(records: RegistrationRecord[]) {
  const index = participationIndex(records);
  const groups = buildEventGroups(records);
  return [...index].filter(([, events]) => events.size >= 3).map(([rrn, events]) => {
    const occurrences: Array<{ record: RegistrationRecord; person: TeamMember; eventId: string; role: string; memberIndex: number | null; uncertain: boolean }> = [];
    for (const eventId of events) for (const group of groups.events.get(eventId) || []) for (const member of group.members) {
      if (normalizeRrn(member.person.rrn) === rrn) occurrences.push({ record: group.record, person: member.person, eventId, role: member.role, memberIndex: member.memberIndex, uncertain: false });
    }
    for (const a of groups.unassigned) if (normalizeRrn(a.member.rrn) === rrn) for (const eventId of a.possibleEvents) occurrences.push({ record: a.record, person: a.member, eventId, role: 'Teammate — assignment needs review', memberIndex: a.index, uncertain: true });
    return { rrn, events: [...events], occurrences, uncertain: occurrences.some(o => o.uncertain) };
  }).sort((a, b) => b.events.length - a.events.length || a.rrn.localeCompare(b.rrn));
}

export const eventTitle = (id: string) => TEAM_RULES[id]?.title || id;
