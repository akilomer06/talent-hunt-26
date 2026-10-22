import type { RegistrationRecord, TeamMember } from './supabase';
import { TEAM_RULES } from '../../shared/registrationRules';

export const PERSON_FIELDS = ['name', 'rrn', 'mobile', 'programme', 'year', 'department', 'section'] as const;
export const FIELD_LABELS: Record<typeof PERSON_FIELDS[number], string> = { name: 'Name', rrn: 'RRN', mobile: 'Mobile', programme: 'Programme', year: 'Year', department: 'Department', section: 'Section' };
const text = (v: string | undefined) => (v || '').trim().replace(/\s+/g, ' ').toUpperCase();
const rrn = (v: string) => text(v).replace(/\s/g, '');

export function formatIndiaTime(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Time not recorded';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(new Date(value)) + ' IST';
}

export function registrationMatchesSearch(record: RegistrationRecord, query: string, titles: Record<string, string> = {}) {
  const q = text(query);
  if (!q) return true;
  return [record.reg_id, ...PERSON_FIELDS.map(f => record[f] || ''), ...record.selected_events.flatMap(id => [id, titles[id] || '']), ...(record.team_members || []).flatMap(m => PERSON_FIELDS.map(f => m[f] || ''))].some(value => text(value).includes(q));
}

export function assignedEvent(record: RegistrationRecord, member: TeamMember): string | undefined {
  // An explicit empty assignment is a review marker, not permission to infer.
  if (Object.hasOwn(member, 'event_id')) return member.event_id || undefined;
  const options = record.selected_events.filter(id => (TEAM_RULES[id]?.max || 1) > 1);
  return options.length === 1 ? options[0] : undefined;
}

export interface DuplicatePerson { person: TeamMember; role: string; uncertain: boolean }
export function eventPeople(record: RegistrationRecord, eventId: string): DuplicatePerson[] {
  const people: DuplicatePerson[] = [{ person: record, role: 'Registrant', uncertain: false }];
  (record.team_members || []).forEach(member => {
    const assigned = assignedEvent(record, member);
    if (assigned === eventId || (!assigned && (TEAM_RULES[eventId]?.max || 1) > 1)) people.push({ person: member, role: 'Teammate', uncertain: !assigned });
  });
  return people;
}

function identityKeys(p: TeamMember): string[] {
  const keys: string[] = [];
  if (rrn(p.rrn)) keys.push('rrn:' + rrn(p.rrn));
  const name = text(p.name);
  const phone = p.mobile.replace(/\D/g, '');
  if (name && phone) keys.push(`phone:${name}:${phone}`);
  // A name plus academic details is only a possible identity match, never proof.
  if (name && p.programme && p.department && p.year) keys.push(`academic:${name}:${text(p.programme)}:${text(p.department)}:${text(p.year)}:${text(p.section)}`);
  return keys;
}

function sameIdentity(a: TeamMember, b: TeamMember) {
  const keys = new Set(identityKeys(a));
  return identityKeys(b).some(key => keys.has(key));
}
const profile = (p: TeamMember) => JSON.stringify(PERSON_FIELDS.map(f => f === 'rrn' ? rrn(p.rrn) : text(p[f])));

export interface DuplicateComparison { from: RegistrationRecord; to: RegistrationRecord; tags: string[]; descriptions: string[] }
export interface DuplicateGroup { id: string; eventId: string; records: RegistrationRecord[]; tags: string[]; comparisons: DuplicateComparison[]; internalWarnings: string[] }

function compare(from: RegistrationRecord, to: RegistrationRecord, eventId: string): DuplicateComparison {
  const a = eventPeople(from, eventId), b = eventPeople(to, eventId);
  const tags: string[] = [], descriptions: string[] = [];
  const signature = (ps: DuplicatePerson[]) => ps.map(p => profile(p.person)).sort().join('|');
  const exact = signature(a) === signature(b) && ![...a, ...b].some(p => p.uncertain);
  if (exact) {
    tags.push('Exact duplicate');
    if (rrn(from.rrn) !== rrn(to.rrn)) tags.push('Registrant / teammate swapped');
    descriptions.push('The same participants and details appear in this event; participant order does not matter.');
  }
  const remaining = new Set(b.map((_, i) => i));
  const removed: TeamMember[] = [];
  for (const before of a) {
    // Prefer the same RRN, then the closest matching identity; use each person once.
    const choices = [...remaining].filter(i => sameIdentity(before.person, b[i]!.person));
    choices.sort((i, j) => Number(rrn(before.person.rrn) !== rrn(b[i]!.person.rrn)) - Number(rrn(before.person.rrn) !== rrn(b[j]!.person.rrn)));
    const found = choices[0];
    if (found === undefined) { removed.push(before.person); continue; }
    remaining.delete(found);
    const after = b[found]!;
    const changed = PERSON_FIELDS.filter(f => text(before.person[f]) !== text(after.person[f]));
    if (changed.length) {
      tags.push('Participant details changed');
      if (rrn(before.person.rrn) !== rrn(after.person.rrn)) tags.push('Possible identity match — verify RRN');
      for (const f of changed) descriptions.push(`${before.person.name} (${before.person.rrn}): ${FIELD_LABELS[f]} changed from “${before.person[f] || 'not provided'}” to “${after.person[f] || 'not provided'}”.`);
    }
  }
  const added = [...remaining].map(i => b[i]!.person);
  if (removed.length || added.length) {
    tags.push('Team members changed');
    if (removed.length) descriptions.push('Only in earlier submission: ' + removed.map(p => `${p.name} (${p.rrn})`).join(', ') + '.');
    if (added.length) descriptions.push('Only in later submission: ' + added.map(p => `${p.name} (${p.rrn})`).join(', ') + '.');
    descriptions.push('A participant overlaps, but the event teams differ. Review both teams before choosing which entry to keep.');
  }
  if ([...a, ...b].some(p => p.uncertain)) {
    tags.push('Event assignment needs review');
    descriptions.push('Some older teammates have no event assignment. They are shown as possible matches; assign their event before resolving.');
  }
  return { from, to, tags: [...new Set(tags)], descriptions };
}

/** Read-only analysis of raw submissions; never deduplicates or mutates registrations. */
export function buildDuplicateGroups(records: RegistrationRecord[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const eventIds = [...new Set(records.flatMap(r => r.selected_events))];
  for (const eventId of eventIds) {
    const entries = records.filter(r => r.selected_events.includes(eventId)).sort((a, b) => (Date.parse(a.created_at || '') || 0) - (Date.parse(b.created_at || '') || 0) || a.reg_id.localeCompare(b.reg_id));
    const parents = entries.map((_, i) => i);
    const root = (i: number): number => parents[i] === i ? i : (parents[i] = root(parents[i]!));
    const seen = new Map<string, number>();
    const internal = new Map<number, string[]>();
    entries.forEach((record, i) => {
      const people = eventPeople(record, eventId);
      const local = new Map<string, number>();
      people.forEach(({ person }, personIndex) => {
        identityKeys(person).forEach(key => {
          const within = local.get(key);
          if (within !== undefined && within !== personIndex) {
            const warnings = internal.get(i) || [];
            warnings.push(`${person.name} (${person.rrn}) may appear more than once inside ${record.reg_id}.`);
            internal.set(i, warnings);
          }
          local.set(key, personIndex);
          const other = seen.get(key);
          if (other !== undefined && other !== i) parents[root(i)] = root(other);
          seen.set(key, i);
        });
      });
    });
    const components = new Map<number, number[]>();
    entries.forEach((_, i) => { const r = root(i); components.set(r, [...(components.get(r) || []), i]); });
    for (const indexes of components.values()) {
      if (indexes.length < 2 && !internal.has(indexes[0]!)) continue;
      const members = indexes.map(i => entries[i]!);
      const comparisons: DuplicateComparison[] = [];
      for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
        const a = members[i]!, b = members[j]!;
        if (eventPeople(a, eventId).some(p => eventPeople(b, eventId).some(q => sameIdentity(p.person, q.person)))) comparisons.push(compare(a, b, eventId));
      }
      const internalWarnings = [...new Set(indexes.flatMap(i => internal.get(i) || []))];
      groups.push({ id: `${eventId}:${members[0]!.reg_id}`, eventId, records: members, comparisons, internalWarnings, tags: [...new Set([...comparisons.flatMap(c => c.tags), ...(internalWarnings.length ? ['Repeated participant within form'] : [])])] });
    }
  }
  return groups;
}

/** A local draft that removes one event and only its assigned teammates. */
export function withoutRegistrationEvent(record: RegistrationRecord, eventId: string): RegistrationRecord {
  return { ...record, selected_events: record.selected_events.filter(id => id !== eventId), team_members: (record.team_members || []).filter(m => assignedEvent(record, m) !== eventId).map(m => ({ ...m, ...(!assignedEvent(record, m) ? { event_id: '' } : {}) })) };
}
