import { describe, expect, it } from 'vitest';
import { assignedEvent, buildDuplicateGroups, formatIndiaTime, registrationMatchesSearch, withoutRegistrationEvent } from '../lib/registrationDuplicates';
import type { RegistrationRecord, TeamMember } from '../lib/supabase';

const person = (name: string, rrn: string): TeamMember => ({ name, rrn, mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A' });
const record = (id: string, registrant = person('Alice', '001'), team = [person('Bob', '002')], event = 'code-canvas'): RegistrationRecord => ({ ...registrant, reg_id: id, created_at: id === 'A' ? '2026-10-22T01:00:00Z' : '2026-10-22T09:15:00Z', selected_events: [event], team_members: team.map(p => ({ ...p, event_id: event })) });

describe('event-wise duplicate analysis', () => {
  it('groups exact teams independently of registrant/teammate roles and participant order', () => {
    const groups = buildDuplicateGroups([record('A'), record('B', person('Bob', '002'), [person('Alice', '001')])]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.tags).toEqual(['Exact duplicate', 'Registrant / teammate swapped']);
  });
  it('reports every changed detail, including a changed RRN matched by name/contact', () => {
    const older = record('A');
    const newer = record('B', { ...person('Alice', '009'), year: 'III', section: 'C' });
    const group = buildDuplicateGroups([newer, older])[0]!;
    expect(group.tags).not.toContain('Exact duplicate');
    expect(group.tags).toContain('Possible identity match — verify RRN');
    expect(group.comparisons[0]!.descriptions.join(' ')).toContain('RRN changed from “001” to “009”');
    expect(group.comparisons[0]!.descriptions.join(' ')).toContain('Year changed');
    expect(group.comparisons[0]!.descriptions.join(' ')).toContain('Section changed');
    expect(group.records[0]!.reg_id).toBe('A');
  });
  it('detects overlaps involving only teammates and explains changed squads', () => {
    const group = buildDuplicateGroups([record('A'), record('B', person('Carol', '003'), [person('Bob', '002')])])[0]!;
    expect(group.tags).toContain('Team members changed');
    expect(group.comparisons[0]!.descriptions.join(' ')).toContain('Only in earlier submission: Alice (001)');
    expect(group.comparisons[0]!.descriptions.join(' ')).toContain('Only in later submission: Carol (003)');
  });
  it('connects overlapping teams as one group but keeps unrelated teams and events separate', () => {
    const groups = buildDuplicateGroups([record('A'), record('B', person('Bob', '002'), [person('Carol', '003')]), record('C', person('Carol', '003'), [person('Dina', '004')]), record('D', person('Else', '999'), []), record('E', person('Alice', '001'), [], 'fifa')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.records.map(r => r.reg_id)).toEqual(['A', 'B', 'C']);
    expect(groups[0]!.comparisons).toHaveLength(2);
  });
  it('flags repeated people within one submission and uncertain legacy event assignments', () => {
    expect(buildDuplicateGroups([record('A', person('Alice', '001'), [person('Alice', '001')])])[0]!.tags).toContain('Repeated participant within form');
    const legacy = { ...record('A'), selected_events: ['code-canvas', 'trashion'], team_members: [person('Bob', '002')] };
    expect(buildDuplicateGroups([legacy, record('B')])[0]!.tags).toContain('Event assignment needs review');
  });
  it('searches teammate details without mutating or deduplicating source data', () => {
    const source = record('A');
    const before = JSON.stringify(source);
    expect(registrationMatchesSearch(source, 'Bob')).toBe(true);
    expect(registrationMatchesSearch(source, '002')).toBe(true);
    expect(registrationMatchesSearch(source, 'Code Canvas', { 'code-canvas': 'Code Canvas' })).toBe(true);
    expect(registrationMatchesSearch(source, 'missing')).toBe(false);
    buildDuplicateGroups([source, record('B')]);
    expect(JSON.stringify(source)).toBe(before);
  });
  it('removes only the chosen event in a local draft, retaining the other event, ID, time and squad', () => {
    const original = { ...record('A'), selected_events: ['code-canvas', 'trashion'], team_members: [{ ...person('Bob', '002'), event_id: 'code-canvas' }, { ...person('Carol', '003'), event_id: 'trashion' }] };
    const draft = withoutRegistrationEvent(original, 'code-canvas');
    expect(draft.selected_events).toEqual(['trashion']);
    expect(draft.team_members.map(p => p.name)).toEqual(['Carol']);
    expect(draft.reg_id).toBe(original.reg_id);
    expect(draft.created_at).toBe(original.created_at);
    expect(original.selected_events).toHaveLength(2);
    expect(original.team_members).toHaveLength(2);
  });
  it('formats timestamps in India time using 12-hour AM/PM, regardless of host timezone', () => {
    expect(formatIndiaTime('2026-10-22T09:15:00Z').toLowerCase()).toContain('02:45:00 pm');
    expect(formatIndiaTime('2026-10-22T09:15:00Z')).toContain('IST');
    expect(formatIndiaTime('bad')).toBe('Time not recorded');
  });
  it('does not silently reassign ambiguous legacy teammates after dropping one event', () => {
    const legacy = { ...record('A'), selected_events: ['code-canvas', 'trashion'], team_members: [person('Bob', '002')] };
    const draft = withoutRegistrationEvent(legacy, 'code-canvas');
    expect(draft.team_members).toHaveLength(1);
    expect(draft.team_members[0]!.event_id).toBe('');
    expect(assignedEvent(draft, draft.team_members[0]!)).toBeUndefined();
  });
});
