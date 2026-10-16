import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildRegistrationWorkbook, buildEventWorkbook } from '../lib/excelExports';
import { buildEventRosters } from '../lib/participantExports';
import type { RegistrationRecord } from '../lib/supabase';

const records: RegistrationRecord[] = [{
  reg_id: 'TH26-0001', name: 'Asha', rrn: '001234567890123456', mobile: '0123456789', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A', selected_events: ['code-canvas', 'bid-wars'], created_at: '2026-10-16T08:00:00Z',
  team_members: [{ event_id: 'code-canvas', name: '=Not a formula', rrn: '002', mobile: '0987654321', programme: 'B.Tech', year: 'III', department: 'AI&DS', section: 'B' }],
}];
const events = [{ id: 'code-canvas', title: 'Code Canvas', category: 'technical', number: '02' }, { id: 'bid-wars', title: 'Bid Wars', category: 'non-technical', number: '08' }, { id: 'fifa', title: 'FIFA', category: 'non-technical', number: '06' }];

describe('organized Excel workbooks', () => {
  it('writes separate, styled event sheets and preserves text IDs, formulas, dates, filters and panes on reload', async () => {
    const workbook = buildRegistrationWorkbook(records, events, new Date('2026-10-16T09:00:00Z'));
    const bytes = await workbook.xlsx.writeBuffer();
    const saved = new ExcelJS.Workbook();
    await saved.xlsx.load(bytes);
    expect(saved.worksheets.map(sheet => sheet.name)).toEqual(['Overview', 'Registrations', 'T02 Code Canvas', 'N08 Bid Wars', 'N06 FIFA']);
    const registration = saved.getWorksheet('Registrations')!;
    expect(registration.getCell('D6').value).toBe('001234567890123456');
    expect(registration.getCell('D6').numFmt).toBe('@');
    expect(registration.getCell('E6').value).toBe('0123456789');
    expect(registration.getCell('L6').value).toBeInstanceOf(Date);
    const code = saved.getWorksheet('T02 Code Canvas')!;
    expect(code.getCell('D7').value).toBe('TH26-0001');
    expect(code.getCell('B7').value).toBe('=Not a formula');
    expect(code.getCell('B7').type).toBe(ExcelJS.ValueType.String);
    expect(code.getCell('C8').value).toEqual({ formula: 'COUNT(A6:A7)', result: 2 });
    expect(code.autoFilter).toBe('A5:L7');
    expect(code.views[0]).toMatchObject({ state: 'frozen', xSplit: 2, ySplit: 5, showGridLines: false });
    expect(code.getCell('A5').fill).toMatchObject({ fgColor: { argb: 'FF1D4ED8' } });
    expect(saved.getWorksheet('N08 Bid Wars')?.getCell('C7').value).toEqual({ formula: 'COUNT(A6:A6)', result: 1 });
    expect(saved.getWorksheet('N06 FIFA')?.getCell('C6').value).toBe(0);
    expect(saved.getWorksheet('Overview')?.getCell('D8').value).toEqual({ formula: "'T02 Code Canvas'!C8", result: 2 });
    expect(saved.getWorksheet('Overview')?.getCell('E8').value).toMatchObject({ hyperlink: "#'T02 Code Canvas'!A1" });
  });
  it('sanitizes long duplicate event titles and retains ambiguous teammates for review', () => {
    const title = 'Invalid/[event]: name?'.repeat(3);
    const legacy = { ...records[0]!.team_members[0]! };
    delete legacy.event_id;
    const workbook = buildRegistrationWorkbook([{ ...records[0]!, team_members: [legacy] }], events.map(event => ({ ...event, title, number: '01', category: 'technical' })));
    const names = workbook.worksheets.map(sheet => sheet.name);
    expect(new Set(names.map(name => name.toLowerCase())).size).toBe(names.length);
    expect(names.every(name => name.length <= 31 && !/[\\/*?:[\]]/.test(name))).toBe(true);
    expect(workbook.getWorksheet('Needs review')).toBeDefined();
    expect(workbook.getWorksheet('Needs review')?.getCell('C7').value).toMatchObject({ result: 1 });
  });
  it('event download contains only its own individual participants and does not mutate the roster', () => {
    const roster = buildEventRosters(records).events.get('code-canvas')!;
    const before = JSON.stringify(roster);
    const workbook = buildEventWorkbook(events[0]!, roster);
    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.worksheets[0]?.getCell('C8').value).toMatchObject({ result: 2 });
    expect(JSON.stringify(roster)).toBe(before);
  });
});
