import ExcelJS, { type CellValue, type Worksheet } from 'exceljs';
import type { RegistrationRecord } from './supabase';
import { buildEventRosters, type EventParticipant } from './participantExports';
import { normalizeYear } from './academicCounts';
import type { EventGroup } from './participationViews';
import type { TeamMember } from './supabase';

type ExportEvent = { id: string; title: string; category?: string; number?: string };
const navy = 'FF0F172A';
const blue = 'FF1D4ED8';
const orange = 'FFC2410C';
const slate = 'FF475569';
const headerRow = 5;
const firstDataRow = headerRow + 1;
const participantColumns = [
  ['No.', 7], ['Name', 30], ['RRN', 22], ['Pass ID(s)', 26], ['Programme', 16], ['Year', 10],
  ['Department', 20], ['Section', 12], ['Mobile', 18], ['Role', 24], ['Registered By', 42], ['Registered On (UTC)', 30],
] as const;

function sheetName(label: string, used: Set<string>) {
  const base = label.replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31).replace(/^'+|'+$/g, '').trim() || 'Event';
  let name = base, suffix = 2;
  while (used.has(name.toLowerCase())) { const end = ` (${suffix++})`; name = base.slice(0, 31 - end.length) + end; }
  used.add(name.toLowerCase());
  return name;
}
const quoteSheet = (name: string) => "'" + name.replace(/'/g, "''") + "'";
function title(sheet: Worksheet, text: string, note: string) {
  sheet.getCell('A2').value = text;
  sheet.getCell('A2').font = { name: 'Arial', size: 16, bold: true, color: { argb: navy } };
  sheet.getRow(2).height = 26;
  sheet.getCell('A3').value = note;
  sheet.getCell('A3').font = { name: 'Arial', size: 10, color: { argb: slate } };
  sheet.getRow(3).height = 20;
}

function table(workbook: ExcelJS.Workbook, name: string, label: string, columns: ReadonlyArray<readonly [string, number]>, rows: CellValue[][], color: string, note: string, totalLabel: string, totalColumn = 3, freezeColumns = 2) {
  const sheet = workbook.addWorksheet(name, {
    properties: { tabColor: { argb: color }, defaultRowHeight: 22 },
    views: [{ state: 'frozen', xSplit: freezeColumns, ySplit: headerRow, showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:5' },
  });
  sheet.columns = columns.map(([, width]) => ({ width }));
  title(sheet, label, note);
  const heading = sheet.getRow(headerRow);
  heading.values = columns.map(([text]) => text);
  heading.height = 32;
  heading.eachCell(cell => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
  });
  rows.forEach((values, index) => {
    const row = sheet.getRow(firstDataRow + index);
    row.values = values;
    let lines = 1;
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: navy } };
      cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left', wrapText: true, indent: column === 1 ? 0 : 1 };
      // Strings are explicitly text, including identifiers and formula-like names.
      cell.numFmt = typeof cell.value === 'string' ? '@' : cell.value instanceof Date ? 'dd mmm yyyy hh:mm "UTC"' : '#,##0';
      if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      const text = typeof cell.value === 'string' ? cell.value : '';
      lines = Math.max(lines, text.split('\n').reduce((n, part) => n + Math.max(1, Math.ceil(part.length / Math.max(8, (columns[column - 1]?.[1] || 20) - 3))), 0));
    });
    row.height = Math.min(400, Math.max(24, lines * 14 + 8));
  });
  sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow + rows.length, column: columns.length } };
  const totalRow = firstDataRow + rows.length;
  const total = sheet.getRow(totalRow);
  total.getCell(2).value = totalLabel;
  total.getCell(totalColumn).value = rows.length ? { formula: `COUNT(A${firstDataRow}:A${totalRow - 1})`, result: rows.length } : 0;
  total.height = 28;
  for (let column = 1; column <= columns.length; column++) {
    const cell = total.getCell(column);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: navy } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.border = { top: { style: 'thin', color: { argb: color } } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.numFmt = '#,##0';
  }
  sheet.pageSetup.printArea = `A1:${sheet.getColumn(columns.length).letter}${totalRow}`;
  sheet.headerFooter.oddFooter = '&LTalent Hunt 2K26&RPage &P of &N';
  return { sheet, totalRow, countCell: sheet.getCell(totalRow, totalColumn).address };
}

function sortParticipants(people: EventParticipant[]) {
  const yearOrder = (year: string) => ['I', 'II', 'III', 'IV'].indexOf(normalizeYear(year));
  return [...people].sort((a, b) => a.programme.localeCompare(b.programme) || yearOrder(a.year) - yearOrder(b.year) || a.department.localeCompare(b.department) || (a.section || '').localeCompare(b.section || '') || a.name.localeCompare(b.name) || a.rrn.localeCompare(b.rrn));
}
function dateValue(dates: string[]): CellValue {
  if (dates.length === 1 && !Number.isNaN(Date.parse(dates[0]!))) return new Date(dates[0]!);
  return dates.join('\n');
}
function participantValues(person: EventParticipant, index: number): CellValue[] {
  return [index + 1, person.name, person.rrn, person.passIds.join('\n'), person.programme, person.year, person.department, person.section || '', person.mobile, person.roles.join('\n'), person.registeredBy.join('\n'), dateValue(person.registrationDates)];
}
function newWorkbook(now: Date) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Talent Hunt 2K26';
  workbook.created = now;
  workbook.modified = now;
  workbook.calcProperties.fullCalcOnLoad = true;
  return workbook;
}

export function buildEventWorkbook(event: ExportEvent, participants: EventParticipant[], now = new Date()) {
  const workbook = newWorkbook(now);
  table(workbook, 'Participants', `${event.title} participants`, participantColumns, sortParticipants(participants).map(participantValues), event.category === 'non-technical' ? orange : blue,
    `${participants.length} unique participants. Teammates share the parent registration pass ID.`, 'Total participants');
  return workbook;
}

export function buildEventGroupsWorkbook(event: ExportEvent, groups: EventGroup[], unassigned: Array<{ record: RegistrationRecord; member: TeamMember; possibleEvents: string[] }> = [], now = new Date()) {
  const workbook = newWorkbook(now);
  const rows: CellValue[][] = groups.flatMap((group, groupIndex) => group.members.map(member => [
    groupIndex + 1, group.record.reg_id, event.title, member.role, member.person.name, member.person.rrn, member.person.mobile,
    member.person.programme, member.person.year, member.person.department, member.person.section || '',
    group.record.name, group.record.rrn, group.record.mobile, group.members.length,
    dateValue(group.record.created_at ? [group.record.created_at] : []), member.assignment,
  ]));
  const { sheet } = table(workbook, 'Event Groups', `${event.title} teams and participants`, [
    ['Team No.', 11], ['Team / Pass ID', 26], ['Event', 25], ['Role', 28], ['Name', 30], ['RRN', 22], ['Phone', 18],
    ['Programme', 16], ['Year', 10], ['Department', 20], ['Section', 12], ['Original Registrant', 30], ['Registrant RRN', 22],
    ['Registrant Phone', 18], ['Team Size', 12], ['Submitted (UTC)', 28], ['Assignment', 54],
  ], rows, blue, `${groups.length} source teams/groups; ${rows.length} member entries. BGMI fifth-player slot is the substitute. Team blocks retain original member order.`, 'Member entries', 3, 2);
  let cursor = firstDataRow;
  groups.forEach((group, index) => {
    group.members.forEach((_, offset) => {
      const row = sheet.getRow(cursor + offset);
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'FFEFF6FF' : 'FFFFFFFF' } };
        if (offset === 0) cell.border = { top: { style: 'medium', color: { argb: blue } } };
      });
    });
    cursor += group.members.length;
  });
  if (unassigned.length) table(workbook, 'Needs review', 'Historical teammate assignments needing review', [
    ['No.', 7], ['Pass ID', 26], ['Name', 30], ['RRN', 22], ['Phone', 18], ['Programme', 16], ['Year', 10], ['Department', 20], ['Section', 12], ['Possible Event IDs', 48],
  ], unassigned.map((a, i) => [i + 1, a.record.reg_id, a.member.name, a.member.rrn, a.member.mobile, a.member.programme, a.member.year, a.member.department, a.member.section || '', a.possibleEvents.join('\n')]), orange,
    'Original entries are retained. Their event is uncertain; they are not added to a team by assumption.', 'Unassigned entries');
  return workbook;
}

/** Printable team attendance, with individual signatures and space for walk-ins. */
export function buildEventAttendanceWorkbook(event: ExportEvent, groups: EventGroup[], unassignedCount = 0, now = new Date()) {
  const workbook = newWorkbook(now);
  const black = 'FF000000';
  const columns = [
    ['Team No.', 7], ['Team / Pass ID', 23], ['Event', 18], ['Role', 17], ['Name', 27], ['RRN', 18],
    ['Phone', 15], ['Programme', 12], ['Year', 7], ['Department', 16], ['Section', 8], ['Signature', 25],
  ] as const;
  const sheet = workbook.addWorksheet('Attendance and Signatures', {
    properties: { defaultRowHeight: 36 },
    views: [{ state: 'frozen', ySplit: headerRow, showGridLines: false }],
    pageSetup: {
      paperSize: 9, orientation: 'landscape', blackAndWhite: true,
      fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:5',
      margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.15 },
    },
  });
  sheet.columns = columns.map(([, width]) => ({ width }));
  const styleRow = (number: number, values: CellValue[], heading = false) => {
    const row = sheet.getRow(number);
    row.values = values;
    row.height = heading ? 30 : 36;
    for (let column = 1; column <= columns.length; column++) {
      const cell = row.getCell(column);
      cell.font = { name: 'Arial', size: 11, bold: heading, color: { argb: black } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: heading || column === 1 ? 'center' : 'left', wrapText: true };
      cell.numFmt = typeof cell.value === 'number' ? '0' : '@';
      const edge = { style: 'thin' as const, color: { argb: black } };
      cell.border = { top: edge, bottom: edge, left: edge, right: edge };
    }
    return row;
  };
  const note = (number: number, text: string, size = 11, bold = false, height = 22) => {
    sheet.mergeCells(number, 1, number, columns.length);
    const cell = sheet.getCell(number, 1);
    cell.value = text;
    cell.font = { name: 'Arial', size, bold, color: { argb: black } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    sheet.getRow(number).height = height;
  };
  sheet.getRow(1).height = 8;
  note(2, `${event.title} — Attendance & Signature Sheet`, 16, true, 28);
  const count = groups.reduce((total, group) => total + group.members.length, 0);
  note(3, `Talent Hunt 2K26 | ${groups.length} teams/groups | ${count} registered member entries`);
  note(4, unassignedCount
    ? `${unassignedCount} historical teammate ${unassignedCount === 1 ? 'entry needs' : 'entries need'} event assignment. See the regular Excel download's Needs review sheet.`
    : 'Team members share a pass ID. Each student signs their own row.');
  styleRow(headerRow, columns.map(([label]) => label), true);
  let cursor = firstDataRow;
  let pageHeight = 0;
  const bodyHeight = 430;
  groups.forEach((group, groupIndex) => {
    if (!group.members.length) return;
    const heights = group.members.map(member => Math.max(36, ...[
      [member.role, 17], [member.person.name, 27], [member.person.department, 16],
    ].map(([text, width]) => Math.ceil(String(text).length / (Number(width) - 2)) * 15 + 8)));
    // The shared cells need enough combined height for long administrative pass IDs.
    const sharedHeight = Math.max(
      Math.ceil(group.record.reg_id.length / 21), Math.ceil(event.title.length / 16),
    ) * 15 + 8;
    heights[0] = Math.max(heights[0]!, sharedHeight - heights.slice(1).reduce((sum, height) => sum + height, 0));
    const groupHeight = heights.reduce((sum, height) => sum + height, 0);
    if (pageHeight && pageHeight + groupHeight > bodyHeight) {
      sheet.getRow(cursor - 1).addPageBreak();
      pageHeight = 0;
    }
    const start = cursor;
    group.members.forEach((member, index) => {
      const person = member.person;
      const row = styleRow(cursor++, [
        index ? null : groupIndex + 1, index ? null : group.record.reg_id, index ? null : event.title,
        member.role, person.name, person.rrn, person.mobile, person.programme, person.year, person.department, person.section || null, null,
      ]);
      row.height = heights[index]!;
    });
    if (cursor - start > 1) for (const column of [1, 2, 3]) sheet.mergeCells(start, column, cursor - 1, column);
    pageHeight += groupHeight;
  });
  if (!count) { note(cursor++, 'No online registrations for this event.'); pageHeight += 22; }
  sheet.getRow(cursor++).height = 12;
  // Keep the labelled walk-in section and its ten writing rows on the same page.
  if (pageHeight + 12 + 26 + 30 + 10 * 36 > bodyHeight) sheet.getRow(cursor - 1).addPageBreak();
  note(cursor++, 'On-the-spot registration — 10 additional participant rows', 12, true, 26);
  styleRow(cursor++, columns.map(([label]) => label), true);
  for (let index = 0; index < 10; index++) styleRow(cursor++, Array<CellValue>(columns.length).fill(null));
  sheet.pageSetup.printArea = `A1:L${cursor - 1}`;
  sheet.headerFooter.oddFooter = '&LTalent Hunt 2K26&RPage &P of &N';
  return workbook;
}

export function buildRegistrationWorkbook(records: RegistrationRecord[], labels: ExportEvent[], now = new Date()) {
  const workbook = newWorkbook(now);
  const rosters = buildEventRosters(records);
  const events = [...labels];
  for (const id of rosters.events.keys()) if (!events.some(event => event.id === id)) events.push({ id, title: id });
  const titles = new Map(events.map(event => [event.id, event.title]));
  const overview = workbook.addWorksheet('Overview', { properties: { tabColor: { argb: navy } }, views: [{ showGridLines: false }] });
  const used = new Set(['overview', 'registrations', 'needs review']);
  const registrationRows: CellValue[][] = records.map((record, index) => [index + 1, record.reg_id, record.name, record.rrn, record.mobile, record.programme, record.year, record.department, record.section || '', record.selected_events.map(id => titles.get(id) || id).join('\n'), record.team_members?.length || 0, dateValue(record.created_at ? [record.created_at] : []),
    (record.team_members || []).map(member => `${member.event_id ? (titles.get(member.event_id) || member.event_id) + ': ' : ''}${member.name} (${member.rrn}${member.section ? ` Sec ${member.section}` : ''})`).join('\n')]);
  const registrations = table(workbook, 'Registrations', 'Registration forms', [
    ['No.', 7], ['Pass ID', 24], ['Name', 30], ['RRN', 22], ['Mobile', 18], ['Programme', 16], ['Year', 10], ['Department', 20], ['Section', 12], ['Selected Events', 36], ['Teammate Entries', 18], ['Registered On (UTC)', 28], ['Team Details', 64],
  ], registrationRows, slate, 'Original registration forms. Individual students are listed on their event sheets.', 'Total registrations');
  const eventSheets = events.map(event => {
    const people = rosters.events.get(event.id) || [];
    const prefix = event.category === 'technical' ? 'T' : event.category === 'non-technical' ? 'N' : 'E';
    const name = sheetName(`${prefix}${event.number || ''} ${event.title}`, used);
    const result = table(workbook, name, `${event.title} participants`, participantColumns, sortParticipants(people).map(participantValues), prefix === 'N' ? orange : blue,
      `${people.length} unique participants. Sorted by programme, year, department, section and name.`, 'Total participants');
    result.sheet.getCell('A1').value = { text: 'Back to overview', hyperlink: "#'Overview'!A1" };
    result.sheet.getCell('A1').font = { name: 'Arial', size: 10, color: { argb: blue }, underline: true };
    return { event, people, ...result };
  });
  if (rosters.unassigned.length) table(workbook, 'Needs review', 'Teammates needing event assignment', participantColumns, rosters.unassigned.map(participantValues), 'FF92400E',
    'These older teammate records have no clear event assignment and are excluded from event totals.', 'Unassigned teammates');

  overview.columns = [{ width: 34 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 24 }];
  title(overview, 'Talent Hunt 2K26 registration report', `Generated ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }).format(now)} (Dubai time).`);
  overview.getCell('A5').value = 'Registration forms';
  overview.getCell('B5').value = { formula: `${quoteSheet('Registrations')}!${registrations.countCell}`, result: records.length };
  const students = new Set(records.flatMap(record => [record.rrn, ...(record.team_members || []).map(member => member.rrn)]).map(rrn => rrn.trim().replace(/\s+/g, '').toUpperCase()).filter(Boolean));
  overview.getCell('C5').value = 'Unique students';
  overview.getCell('D5').value = students.size;
  overview.getRow(7).values = ['Event', 'Category', 'Registration forms', 'Participants', 'Roster sheet'];
  overview.getRow(7).height = 30;
  overview.getRow(7).eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; });
  eventSheets.forEach(({ event, sheet, countCell, people }, index) => {
    const row = overview.getRow(8 + index);
    row.values = [event.title, event.category === 'technical' ? 'Technical' : event.category === 'non-technical' ? 'Non-technical' : 'Other', records.filter(record => record.selected_events.includes(event.id)).length, { formula: `${quoteSheet(sheet.name)}!${countCell}`, result: people.length }, { text: 'Open participants', hyperlink: `#${quoteSheet(sheet.name)}!A1` }];
    row.height = 26;
    row.eachCell(cell => { cell.font = { name: 'Arial', size: 10, color: { argb: navy } }; cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' || cell.type === ExcelJS.ValueType.Formula ? 'right' : 'left', wrapText: true, indent: 1 }; if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; });
    row.getCell(5).font = { name: 'Arial', size: 10, color: { argb: blue }, underline: true };
  });
  const noteRow = 9 + eventSheets.length;
  overview.getCell(noteRow, 1).value = 'Each student is counted once per event. Students in two events appear on both event sheets.';
  overview.getCell(noteRow + 1, 1).value = 'Teammates share the registration pass ID. Multiple linked pass IDs are retained.';
  if (rosters.unassigned.length) overview.getCell(noteRow + 2, 1).value = `${rosters.unassigned.length} teammate records need event assignment. See Needs review.`;
  for (let row = noteRow; row <= noteRow + 2; row++) overview.getCell(row, 1).font = { name: 'Arial', size: 10, color: { argb: slate } };
  for (const address of ['A5', 'C5']) { overview.getCell(address).font = { name: 'Arial', size: 10, bold: true, color: { argb: navy } }; overview.getCell(address).alignment = { vertical: 'middle', indent: 1 }; }
  for (const address of ['B5', 'D5']) { overview.getCell(address).font = { name: 'Arial', size: 14, bold: true, color: { argb: blue } }; overview.getCell(address).numFmt = '#,##0'; overview.getCell(address).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }; }
  overview.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1, printArea: `A1:E${noteRow + 2}` };
  return workbook;
}

export async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
