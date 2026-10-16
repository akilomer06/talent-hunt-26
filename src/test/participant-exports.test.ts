import { describe, expect, it } from 'vitest';
import { buildEventRosters, buildRegistrationCsv, buildEventCsv, serializeCsv } from '../lib/participantExports';
import type { RegistrationRecord, TeamMember } from '../lib/supabase';

const person = (rrn: string, overrides: Partial<TeamMember> = {}): TeamMember => ({ name: `Student ${rrn}`, rrn, mobile: '0123456789', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A', ...overrides });
const record = (rrn: string, overrides: Partial<RegistrationRecord> = {}): RegistrationRecord => ({ ...person(rrn), reg_id: `PASS-${rrn}`, selected_events: ['code-canvas', 'bid-wars'], team_members: [], created_at: '2026-10-16T08:00:00Z', ...overrides });

describe('certificate participant rosters and CSV', () => {
  it('splits teammates by event, includes pass IDs, and deduplicates RRNs with registrant details taking priority', () => {
    const records = [record('1', { team_members: [person('2', { name: 'Older name', event_id: 'code-canvas' }), person('3', { event_id: 'bid-wars' })] }), record(' 2 ', { reg_id: 'PASS-2', name: 'Current name', selected_events: ['code-canvas'] })];
    const rosters = buildEventRosters(records);
    expect(rosters.events.get('code-canvas')).toHaveLength(2);
    const second = rosters.events.get('code-canvas')?.find(p => p.name === 'Current name');
    expect(second?.passIds).toEqual(['PASS-2', 'PASS-1']);
    expect(second?.roles).toEqual(['Registrant', 'Teammate']);
    expect(rosters.events.get('bid-wars')?.map(p => p.rrn)).toEqual(['1', '3']);
    expect(rosters.unassigned).toEqual([]);
  });
  it('infers a legacy teammate only for a single selected team event and flags ambiguous assignments', () => {
    const clear = buildEventRosters([record('1', { selected_events: ['code-canvas', 'fifa'], team_members: [person('2')] })]);
    expect(clear.events.get('code-canvas')).toHaveLength(2);
    expect(clear.events.get('fifa')).toHaveLength(1);
    const ambiguous = buildEventRosters([record('1', { team_members: [person('2')] })]);
    expect(ambiguous.unassigned).toHaveLength(1);
    expect(ambiguous.events.get('code-canvas')).toHaveLength(1);
  });
  it('keeps registration summary first, then individual event rows and totals including zero-entry events', () => {
    const records = [record('1', { team_members: [person('2', { event_id: 'code-canvas' })] })];
    const csv = buildRegistrationCsv(records, [{ id: 'code-canvas', title: 'Code Canvas' }, { id: 'bid-wars', title: 'Bid Wars' }, { id: 'fifa', title: 'FIFA' }]);
    expect(csv.startsWith('\uFEFF"REGISTRATION SUMMARY"')).toBe(true);
    expect(csv).toContain('"TOTAL REGISTRATIONS","1"');
    expect(csv).toContain('"PASS-1","Student 2","2","0123456789","B.Tech","II","CSE","A","Teammate"');
    expect(csv).toContain('"TOTAL PARTICIPANTS","2"');
    expect(csv).toContain('"TOTAL PARTICIPANTS","1"');
    expect(csv).toContain('"EVENT","FIFA"');
    expect(csv).toContain('"TOTAL PARTICIPANTS","0"');
  });
  it('event download includes only that event and its count', () => {
    const roster = buildEventRosters([record('1', { team_members: [person('2', { event_id: 'bid-wars' })] })]);
    const csv = buildEventCsv({ id: 'code-canvas', title: 'Code Canvas' }, roster.events.get('code-canvas')!);
    expect(csv).toContain('"TOTAL PARTICIPANTS","1"');
    expect(csv).not.toContain('Student 2');
    expect(csv).not.toContain('Bid Wars');
  });
  it('escapes commas, quotes, Unicode and newlines and neutralizes spreadsheet formulas', () => {
    const csv = serializeCsv([['Dani, "A"\nCSE', 'தமிழ்', '=HYPERLINK("bad")', ' +SUM(1,2)', '@formula', '0123456789']]);
    expect(csv).toContain('"Dani, ""A""\nCSE"');
    expect(csv).toContain('தமிழ்');
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"\' +SUM(1,2)"');
    expect(csv).toContain('"\'@formula"');
    expect(csv).toContain('"0123456789"');
  });
});
