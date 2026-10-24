import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildRegistrationWorkbook, buildEventWorkbook, buildEventAttendanceWorkbook } from '../lib/excelExports';
import { buildEventRosters } from '../lib/participantExports';
import { buildEventGroups } from '../lib/participationViews';
import type { RegistrationRecord } from '../lib/supabase';

const records: RegistrationRecord[] = [{
  reg_id: 'TH26-0001', name: 'Asha', rrn: '001234567890123456', mobile: '0123456789', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A', selected_events: ['code-canvas', 'bid-wars'], created_at: '2026-10-16T08:00:00Z',
  team_members: [{ event_id: 'code-canvas', name: '=Not a formula', rrn: '002', mobile: '0987654321', programme: 'B.Tech', year: 'III', department: 'AI&DS', section: 'B' }],
}];
const events = [{ id: 'code-canvas', title: 'Code Canvas', category: 'technical', number: '02' }, { id: 'bid-wars', title: 'Bid Wars', category: 'non-technical', number: '08' }, { id: 'fifa', title: 'FIFA', category: 'non-technical', number: '06' }];

describe('organized Excel workbooks', () => {
  it('saves a monochrome attendance sheet with shared team IDs, individual signatures and exactly ten blank walk-in rows', async () => {
    const duplicate = { ...records[0]!, reg_id: 'TH26-ADMIN-12345678901234567890123456789012' };
    const groups = buildEventGroups([...records, duplicate]).events.get('code-canvas')!;
    const before = JSON.stringify(groups);
    const workbook = buildEventAttendanceWorkbook(events[0]!, groups, 1);
    const saved = new ExcelJS.Workbook();
    await saved.xlsx.load(await workbook.xlsx.writeBuffer());
    expect(saved.worksheets).toHaveLength(1);
    const sheet = saved.worksheets[0]!;
    expect(sheet.columnCount).toBe(12);
    expect(sheet.getRow(8).values).toEqual([undefined, 'Team No.', 'Team / Pass ID', 'Event', 'Role', 'Name', 'RRN', 'Phone', 'Programme', 'Year', 'Department', 'Section', 'Signature']);
    expect(sheet.getCell('B10').master.address).toBe('B9');
    expect(sheet.getCell('C10').master.address).toBe('C9');
    expect(sheet.getCell('B11').value).toBe(duplicate.reg_id);
    expect(sheet.getCell('B12').master.address).toBe('B11');
    expect(sheet.getCell('L10').isMerged).toBe(false);
    expect(sheet.getCell('F9').value).toBe(records[0]!.rrn);
    expect(sheet.getCell('G9').value).toBe('0123456789');
    expect(sheet.getCell('F9').numFmt).toBe('@');
    expect(sheet.getCell('E10').value).toBe('=Not a formula');
    expect(sheet.getCell('E10').type).toBe(ExcelJS.ValueType.String);
    expect(sheet.getCell('A7').text).toContain('1 historical teammate entry needs event assignment');
    expect(sheet.getCell('A3').value).toBe('SCHOOL OF COMPUTER INFORMATION AND MATHEMATICAL SCIENCES');
    expect(sheet.getCell('A4').value).toBe('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING');
    expect(sheet.getCell('A5').value).toBe('ATTENDANCE SHEET');
    for (const address of ['A3', 'A4', 'A5', 'A6']) expect(sheet.getCell(address).alignment.horizontal).toBe('center');
    expect(sheet.getImages()).toHaveLength(1);
    expect(saved.getImage(0).extension).toBe('png');
    expect(workbook.getImage(0).base64).toMatch(/^data:image\/png;base64,/);
    const walkInRow = 14;
    expect(sheet.getCell(walkInRow, 1).text).toContain('On-the-spot registration');
    expect(sheet.getCell(walkInRow, 1).text).toContain('10 additional participant rows');
    expect(sheet.getCell(walkInRow + 1, 12).value).toBe('Signature');
    expect(sheet.rowCount).toBe(walkInRow + 11);
    for (let row = walkInRow + 2; row <= sheet.rowCount; row++) {
      expect(sheet.getRow(row).height).toBeGreaterThanOrEqual(28);
      for (let col = 1; col <= 12; col++) {
        expect(sheet.getCell(row, col).value).toBeNull();
        expect(sheet.getCell(row, col).isMerged).toBe(false);
        expect(sheet.getCell(row, col).border.bottom?.style).toBe('thin');
      }
    }
    for (let row = 9; row <= 12; row++) expect(sheet.getCell(row, 12).value).toBeNull();
    sheet.eachRow(row => row.eachCell({ includeEmpty: true }, cell => {
      if (cell.font.color?.argb) expect(cell.font.color.argb).toBe('FF000000');
      if (cell.fill.type === 'pattern' && cell.fill.fgColor?.argb) expect(cell.fill.fgColor.argb).toBe('FFFFFFFF');
      for (const border of Object.values(cell.border)) if (border?.color?.argb) expect(border.color.argb).toBe('FF000000');
    }));
    expect(sheet.pageSetup).toMatchObject({ blackAndWhite: true, orientation: 'landscape', horizontalCentered: true, fitToWidth: 1, fitToHeight: 0, printArea: 'A1:L25', printTitlesRow: '1:8' });
    expect(JSON.stringify(groups)).toBe(before);
  });
  it('offers ten writable walk-in rows for empty events and retains BGMI substitute roles', () => {
    const empty = buildEventAttendanceWorkbook(events[2]!, []).worksheets[0]!;
    expect(empty.getCell('A9').value).toBe('No online registrations for this event.');
    expect(empty.getCell('A11').text).toContain('On-the-spot registration');
    expect(empty.rowCount).toBe(22);
    const bgmi = { ...records[0]!, selected_events: ['bgmi'], section: '', team_members: [1, 2, 3, 4].map(n => ({ ...records[0]!.team_members[0]!, rrn: String(n), event_id: 'bgmi' })) };
    const groups = buildEventGroups([bgmi]).events.get('bgmi')!;
    const sheet = buildEventAttendanceWorkbook({ id: 'bgmi', title: 'BGMI Championship' }, groups).worksheets[0]!;
    expect(sheet.getCell('D13').value).toBe('Substitute');
    expect(sheet.getCell('B13').master.address).toBe('B9');
    expect(sheet.getCell('L13').isMerged).toBe(false);
    expect(sheet.getCell('K9').value).toBeNull();
  });
  it('fills the fitted page height with more teams, keeping teams and walk-in rows together', () => {
    const large = Array.from({ length: 24 }, (_, i) => ({ ...records[0]!, reg_id: `TH26-${i}` }));
    const groups = buildEventGroups(large).events.get('code-canvas')!;
    const sheet = buildEventAttendanceWorkbook(events[0]!, groups).worksheets[0]!;
    expect(sheet.model.rowBreaks.map(breakRow => breakRow.id)).toEqual([24, 40, 56]);
    for (const [first, last] of [[9, 24], [25, 40], [41, 56], [57, 69]]) {
      const total = Array.from({ length: last! - first! + 1 }, (_, i) => sheet.getRow(first! + i).height!).reduce((sum, height) => sum + height, 0);
      expect(total).toBeGreaterThan(490);
      expect(total).toBeLessThan(500);
    }
    expect(sheet.getCell('B55').value).toBe('TH26-23');
    expect(sheet.rowCount).toBe(69);
    expect(sheet.pageSetup.fitToHeight).toBe(0);
  });
  it('repeats shared IDs when an unusually large historical team must continue on another page', () => {
    const legacy = { ...records[0]!, selected_events: ['bgmi'], team_members: Array.from({ length: 19 }, (_, i) => ({ ...records[0]!.team_members[0]!, event_id: 'bgmi', rrn: String(i) })) };
    const groups = buildEventGroups([legacy]).events.get('bgmi')!;
    const sheet = buildEventAttendanceWorkbook({ id: 'bgmi', title: 'BGMI Championship' }, groups).worksheets[0]!;
    const firstBreak = sheet.model.rowBreaks[0]!.id;
    expect(firstBreak).toBeGreaterThan(8);
    expect(firstBreak).toBeLessThan(28);
    expect(sheet.getCell(firstBreak, 2).master.address).toBe('B9');
    expect(sheet.getCell(firstBreak + 1, 2).value).toBe(legacy.reg_id);
    expect(sheet.getCell(28, 2).master.address).toBe(`B${firstBreak + 1}`);
    expect(sheet.getCell(28, 12).isMerged).toBe(false);
    expect(sheet.getCell(28, 5).value).toBe(legacy.team_members[18]!.name);
  });
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
