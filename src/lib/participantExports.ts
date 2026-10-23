import type { RegistrationRecord, TeamMember } from './supabase';
import { assignedMembers } from '../../shared/participation';

export interface EventParticipant extends TeamMember {
  passIds: string[];
  registeredBy: string[];
  roles: string[];
  registrationDates: string[];
}
type EventLabel = { id: string; title: string };
const rrnKey = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase();

/** One student per event. Their own form takes precedence over teammate copies. */
export function buildEventRosters(records: RegistrationRecord[]) {
  const maps = new Map<string, Map<string, EventParticipant>>();
  const unassigned: EventParticipant[] = [];
  function add(eventId: string, person: TeamMember, record: RegistrationRecord, role: string, fallback: string) {
    let map = maps.get(eventId);
    if (!map) { map = new Map(); maps.set(eventId, map); }
    const key = rrnKey(person.rrn) || fallback;
    let participant = map.get(key);
    if (!participant) {
      participant = { ...person, event_id: eventId, passIds: [], registeredBy: [], roles: [], registrationDates: [] };
      map.set(key, participant);
    }
    const source = `${record.name} (${record.reg_id})`;
    if (!participant.passIds.includes(record.reg_id)) participant.passIds.push(record.reg_id);
    if (!participant.registeredBy.includes(source)) participant.registeredBy.push(source);
    if (!participant.roles.includes(role)) participant.roles.push(role);
    if (record.created_at && !participant.registrationDates.includes(record.created_at)) participant.registrationDates.push(record.created_at);
  }
  for (const record of records) for (const eventId of new Set(record.selected_events)) {
    add(eventId, record, record, 'Registrant', `${record.reg_id}:registrant`);
  }
  for (const record of records) {
    assignedMembers(record).forEach(({ member, index, eventId, role }) => {
      if (eventId && record.selected_events.includes(eventId)) {
        add(eventId, member, record, role, `${record.reg_id}:teammate:${index}`);
      } else {
        // Legacy ambiguous teams must not silently receive the wrong certificate.
        unassigned.push({ ...member, passIds: [record.reg_id], registeredBy: [`${record.name} (${record.reg_id})`], roles: ['Teammate — event assignment needs review'], registrationDates: record.created_at ? [record.created_at] : [] });
      }
    });
  }
  const events = new Map([...maps].map(([id, map]) => [id, [...map.values()].sort((a, b) => a.name.localeCompare(b.name) || a.rrn.localeCompare(b.rrn))]));
  return { events, unassigned };
}

const participantHeaders = ['Pass ID(s)', 'Name', 'RRN', 'Mobile', 'Programme', 'Year', 'Department', 'Section', 'Role', 'Registered By', 'Registration Date(s)', 'Event'];
function participantRow(person: EventParticipant, eventTitle: string) {
  return [person.passIds.join('; '), person.name, person.rrn, person.mobile, person.programme, person.year, person.department, person.section || '', person.roles.join('; '), person.registeredBy.join('; '), person.registrationDates.join('; '), eventTitle];
}

/** Quote every cell, retain Unicode/newlines, and neutralize spreadsheet formulas. */
export function serializeCsv(rows: Array<Array<string | number>>) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    const text = String(value);
    const safe = /^\s*[=+\-@]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
}

export function buildEventCsv(event: EventLabel, participants: EventParticipant[]) {
  return serializeCsv([
    ['EVENT', event.title], participantHeaders,
    ...participants.map(person => participantRow(person, event.title)),
    ['TOTAL PARTICIPANTS', participants.length],
  ]);
}

export function buildRegistrationCsv(records: RegistrationRecord[], eventLabels: EventLabel[]) {
  const titles = new Map(eventLabels.map(event => [event.id, event.title]));
  const rosters = buildEventRosters(records);
  const rows: Array<Array<string | number>> = [
    ['REGISTRATION SUMMARY'],
    ['Registration ID', 'Name', 'RRN', 'Mobile', 'Programme', 'Year', 'Department', 'Section', 'Selected Events', 'Team Count', 'Team Members Details', 'Registration Date'],
    ...records.map(record => [record.reg_id, record.name, record.rrn, record.mobile, record.programme, record.year, record.department, record.section || '', record.selected_events.map(id => titles.get(id) || id).join('; '), record.team_members?.length || 0,
      (record.team_members || []).map(member => `${member.event_id ? (titles.get(member.event_id) || member.event_id) + ': ' : ''}${member.name} (${member.rrn}${member.section ? ` Sec ${member.section}` : ''})`).join('; '), record.created_at || '']),
    ['TOTAL REGISTRATIONS', records.length],
  ];
  // Include retired/custom event IDs too, so an older registration is never lost.
  const ids = [...new Set([...eventLabels.map(event => event.id), ...rosters.events.keys()])];
  for (const id of ids) {
    const title = titles.get(id) || id;
    const participants = rosters.events.get(id) || [];
    rows.push([], ['EVENT', title], participantHeaders, ...participants.map(person => participantRow(person, title)), ['TOTAL PARTICIPANTS', participants.length]);
  }
  if (rosters.unassigned.length) rows.push([], ['TEAMMATES — EVENT ASSIGNMENT NEEDS REVIEW'], participantHeaders, ...rosters.unassigned.map(person => participantRow(person, 'Unassigned')), ['TOTAL UNASSIGNED TEAMMATES', rosters.unassigned.length]);
  return serializeCsv(rows);
}

export function downloadCsv(contents: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
