import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EventGroups } from '../components/EventGroups';
import * as excel from '../lib/excelExports';
import { buildEventGroups } from '../lib/participationViews';

vi.mock('../lib/excelExports', () => ({ buildEventGroupsWorkbook: vi.fn(() => 'teams'), buildEventAttendanceWorkbook: vi.fn(() => 'attendance'), downloadWorkbook: vi.fn().mockResolvedValue(undefined) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const events = [{ id: 'prompt-pop', title: 'Prompt Pop' }];
const records = ['Asha', 'Beena'].map((name, index) => ({ reg_id: `PASS${index}`, name, rrn: `00${index}`, mobile: '0123456789', programme: 'B.Tech', year: 'III', department: 'CSE', section: 'A', selected_events: ['prompt-pop'], team_members: [] }));

describe('event group downloads', () => {
  it('downloads all event teams despite a search filter and keeps the original export separate', async () => {
    render(<EventGroups records={records} events={events} fixedEvent="prompt-pop" />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search event groups' }), { target: { value: 'Asha' } });
    expect(screen.queryByText('Beena', { exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download Prompt Pop Attendance & Signature Sheet' }));
    await waitFor(() => expect(excel.downloadWorkbook).toHaveBeenCalledWith('attendance', 'Talent-Hunt-2K26-prompt-pop-Attendance-Signatures.xlsx'));
    expect(excel.buildEventAttendanceWorkbook).toHaveBeenCalledWith(events[0], buildEventGroups(records).events.get('prompt-pop'), 0);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download Prompt Pop Excel' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Download Prompt Pop Excel' }));
    await waitFor(() => expect(excel.downloadWorkbook).toHaveBeenCalledWith('teams', 'Talent-Hunt-2K26-prompt-pop-Teams.xlsx'));
    expect(excel.buildEventGroupsWorkbook).toHaveBeenCalledWith(events[0], buildEventGroups(records).events.get('prompt-pop'), []);
  });
  it('shows an export failure and allows retry', async () => {
    vi.mocked(excel.downloadWorkbook).mockRejectedValueOnce(new Error('download failed'));
    render(<EventGroups records={records} events={events} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download Prompt Pop Attendance & Signature Sheet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to create the Excel download. Please try again.');
    expect(screen.getByRole('button', { name: 'Download Prompt Pop Attendance & Signature Sheet' })).toBeEnabled();
  });
});
