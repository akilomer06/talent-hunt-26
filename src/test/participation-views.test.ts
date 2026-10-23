import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildEventGroups, buildExcessParticipants } from '../lib/participationViews';
import { buildEventGroupsWorkbook } from '../lib/excelExports';
import type { RegistrationRecord } from '../lib/supabase';

const person = (rrn: string) => ({ name: `Person ${rrn}`, rrn, mobile: '0123456789', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A' });
const record = (id: string, rrn: string, event: string, members: string[] = []): RegistrationRecord => ({ ...person(rrn), reg_id: id, selected_events: [event], team_members: members.map(rrn => ({ ...person(rrn), event_id: event })) });

describe('participation review and grouped event exports', () => {
  it('counts distinct events across roles, preserves teams and duplicate passes without mutating sources', () => {
    const records = [record('A', '001', 'code-canvas'), record('B', '002', 'bgmi', ['003', '004', '005', '0 0 1']), record('C', '006', 'trashion', ['001']), record('DUPLICATE', '001', 'code-canvas')];
    const before = JSON.stringify(records);
    const excess = buildExcessParticipants(records);
    expect(excess).toHaveLength(1);
    expect(excess[0]?.rrn).toBe('001');
    expect(excess[0]?.events).toEqual(['code-canvas', 'bgmi', 'trashion']);
    expect(excess[0]?.occurrences).toHaveLength(4);
    expect(excess[0]?.occurrences.some(o => o.role === 'Substitute')).toBe(true);
    const teams = buildEventGroups(records);
    expect(teams.events.get('code-canvas')).toHaveLength(2);
    expect(teams.events.get('bgmi')?.[0]?.members.map(m => m.role)).toEqual(['Registrant · Main player', 'Teammate · Main player', 'Teammate · Main player', 'Teammate · Main player', 'Substitute']);
    expect(JSON.stringify(records)).toBe(before);
    expect(buildExcessParticipants(records.filter(r => r.reg_id !== 'C'))).toHaveLength(0);
  });
  it('retains ambiguous members for explicit review rather than inventing team assignments', () => {
    const a = { ...record('OLD', '001', 'code-canvas'), selected_events: ['code-canvas', 'trashion'], team_members: [person('002')] };
    const records = [a, record('SECOND', '002', 'shutter-verse')];
    const teams = buildEventGroups(records);
    expect(teams.unassigned).toHaveLength(1);
    expect(teams.events.get('code-canvas')?.[0]?.members).toHaveLength(1);
    expect(buildExcessParticipants(records)[0]).toMatchObject({ rrn: '002', uncertain: true });
  });
  it('saves a separate reloadable BGMI workbook with intact teams, substitute, IDs, phones and source ownership', async () => {
    const records = [record('TH26-0001', '001', 'bgmi', ['002', '003', '004', '005']), record('TH26-0002', '006', 'bgmi', ['007', '008', '009']), record('OTHER', '999', 'tech-talks')];
    const before = JSON.stringify(records);
    const groups = buildEventGroups(records).events.get('bgmi')!;
    const workbook = buildEventGroupsWorkbook({ id: 'bgmi', title: 'BGMI Championship' }, groups);
    const saved = new ExcelJS.Workbook();
    await saved.xlsx.load(await workbook.xlsx.writeBuffer());
    const sheet = saved.getWorksheet('Event Groups')!;
    expect(saved.worksheets).toHaveLength(1);
    expect(sheet.getCell('D10').value).toBe('Substitute');
    expect(sheet.getCell('F10').value).toBe('005');
    expect(sheet.getCell('G10').value).toBe('0123456789');
    expect(sheet.getCell('G10').numFmt).toBe('@');
    expect(sheet.getCell('B10').value).toBe('TH26-0001');
    expect(sheet.getCell('B11').value).toBe('TH26-0002');
    expect(sheet.getCell('M10').value).toBe('001');
    expect(sheet.getCell('C15').value).toMatchObject({ result: 9 });
    expect(sheet.autoFilter).toBe('A5:Q14');
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 5 });
    expect(JSON.stringify(records)).toBe(before);
  });
});
