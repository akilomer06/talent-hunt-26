import { describe, expect, it } from 'vitest';
import { buildAcademicCounts } from '../lib/academicCounts';
import type { RegistrationRecord, TeamMember } from '../lib/supabase';

const person = (rrn: string, overrides: Partial<TeamMember> = {}): TeamMember => ({ name: 'Test', rrn, mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A', ...overrides });
const record = (rrn: string, overrides: Partial<RegistrationRecord> = {}): RegistrationRecord => ({ ...person(rrn), reg_id: 'TEST-' + rrn, selected_events: ['code-canvas'], team_members: [], ...overrides });

describe('programme, year, department and section counts', () => {
  it('shows all requested groups and configured B.Tech sections even when empty', () => {
    const result = buildAcademicCounts([]);
    expect(result.groups.map(group => group.title)).toEqual(['B.Tech · 2nd year', 'B.Tech · 3rd year', 'B.Tech · 4th year', 'M.Tech']);
    expect(result.groups[0]?.departments.map(dept => dept.department)).toEqual(['CSE', 'AI&DS', 'IoT', 'Cybersecurity']);
    expect(result.groups[0]?.departments[0]?.sections.map(section => section.label)).toEqual(['Section A', 'Section B', 'Section C', 'Section D']);
    expect(result.groups[3]?.departments.map(dept => dept.department)).toEqual(['CSE', 'AI&DS']);
    expect(result.students).toBe(0);
  });
  it('deduplicates students across event teams and their own registration forms', () => {
    const teammate = person('T2', { year: 'III', department: 'AI&DS', section: 'B' });
    const result = buildAcademicCounts([
      record('T1', { team_members: [{ ...teammate, event_id: 'code-canvas' }, { ...teammate, event_id: 'bid-wars' }, person('T3', { programme: 'M.Tech', year: 'I', section: 'C' })] }),
      record('T2', { year: 'III', department: 'AI&DS', section: 'B' }),
    ]);
    expect(result.students).toBe(3);
    expect(result.forms).toBe(2);
    expect(result.groups.map(group => group.students)).toEqual([1, 1, 0, 1]);
    expect(result.groups[1]?.departments[1]?.sections.find(section => section.label === 'Section B')?.students).toBe(1);
    expect(result.groups[3]?.departments[0]?.sections).toEqual([{ label: '1st year · Section C', students: 1 }]);
  });
  it('normalizes legacy programme, year, section and department labels', () => {
    const result = buildAcademicCounts([record(' R 1 ', { programme: 'b tech', year: '2nd year', department: 'AIDS', section: 'section b', team_members: [person('r1')] })]);
    expect(result.students).toBe(1);
    expect(result.groups[0]?.departments[1]?.students).toBe(1);
    expect(result.groups[0]?.departments[1]?.sections.find(section => section.label === 'Section B')?.students).toBe(1);
  });
  it('uses a student’s own registration class in preference to a teammate copy', () => {
    const result = buildAcademicCounts([record('A', { team_members: [person('B', { year: 'II' })] }), record('B', { year: 'IV', section: 'D' })]);
    expect(result.groups[0]?.students).toBe(1);
    expect(result.groups[2]?.students).toBe(1);
    expect(result.groups[2]?.departments[0]?.sections.find(section => section.label === 'Section D')?.students).toBe(1);
  });
  it('keeps missing class details visible instead of assigning a fabricated section', () => {
    const result = buildAcademicCounts([record('A', { section: '' }), record('B', { year: '' }), record('C', { programme: '', department: '' }), record('', { reg_id: 'NO-RRN' })]);
    expect(result.students).toBe(3);
    expect(result.missingRrn).toBe(1);
    expect(result.groups[0]?.departments[0]?.sections.find(section => section.label === 'Section not recorded')?.students).toBe(1);
    expect(result.groups.some(group => group.title.includes('Year not recorded'))).toBe(true);
    expect(result.groups.reduce((sum, group) => sum + group.students, 0)).toBe(result.students);
  });
  it('reflects deletions and excludes a removed form’s teammates', () => {
    const rows = [record('A', { team_members: [person('B')] }), record('C')];
    expect(buildAcademicCounts(rows).students).toBe(3);
    expect(buildAcademicCounts(rows.filter(row => row.rrn !== 'A')).students).toBe(1);
  });
});
