import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AdminPage } from '../pages/AdminPage';
import * as api from '../lib/supabase';
import { EVENTS } from '../data/eventsData';

vi.mock('../lib/supabase', async importOriginal => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  return { ...actual, checkAdminSession: vi.fn(), fetchRegistrations: vi.fn(), fetchLiveSiteContent: vi.fn(), checkBackendHealth: vi.fn(), deleteRegistration: vi.fn(), updateRegistration: vi.fn(), createAdminRegistration: vi.fn() };
});
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchRegistrations).mockResolvedValue([{ reg_id: 'TEST', name: 'Test Participant', rrn: '123', mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'IoT', selected_events: ['tech-talks'], team_members: [] }]);
  vi.mocked(api.fetchLiveSiteContent).mockResolvedValue({ events: EVENTS, settings: api.DEFAULT_SITE_SETTINGS });
  vi.mocked(api.checkBackendHealth).mockResolvedValue(true);
});
describe('separate admin portals', () => {
  it.each([false, true])('counts participation per event next to unique participants (registration team: %s)', async registrationOnly => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: registrationOnly ? 'registration' : 'admin' });
    const record = (await api.fetchRegistrations())[0]!;
    const team = [{ event_id: 'code-canvas', name: 'Teammate', rrn: '456', mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE' }];
    vi.mocked(api.fetchRegistrations).mockResolvedValue([
      { ...record, selected_events: ['code-canvas', 'fifa'], team_members: team },
      { ...record, reg_id: 'LEGACY-DUPLICATE', selected_events: ['code-canvas'], team_members: team },
    ]);
    render(<AdminPage registrationOnly={registrationOnly} onBack={() => {}} />);
    const unique = await screen.findByRole('region', { name: 'Total Participants' });
    const participations = screen.getByRole('region', { name: 'Total Event Participations' });
    await waitFor(() => expect(within(unique).getByText('2', { exact: true })).toBeInTheDocument());
    expect(within(participations).getByText('3', { exact: true })).toBeInTheDocument();
    expect(unique.nextElementSibling).toBe(participations);
    expect(api.updateRegistration).not.toHaveBeenCalled();
    expect(api.createAdminRegistration).not.toHaveBeenCalled();
    expect(api.deleteRegistration).not.toHaveBeenCalled();
  });
  it('separates category leaders and finds teammates in the registration roster', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    const record = (await api.fetchRegistrations())[0]!;
    vi.mocked(api.fetchRegistrations).mockResolvedValue([{ ...record, selected_events: ['code-canvas', 'fifa'], team_members: [{ event_id: 'code-canvas', name: 'Searchable Teammate', rrn: 'TEAM-456', mobile: '9000000000', programme: 'B.Tech', year: 'III', department: 'AI&DS', section: 'B' }] }]);
    render(<AdminPage onBack={() => {}} />);
    expect(await screen.findByText('Top Technical Competition')).toBeInTheDocument();
    expect(screen.getByText('Top Non-Technical Competition')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicates' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrations Roster/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search registrations and teammates' }), { target: { value: 'TEAM-456' } });
    expect(screen.getByText('#1 Searchable Teammate')).toBeInTheDocument();
    expect(screen.getByText('Test Participant')).toBeInTheDocument();
    expect(api.updateRegistration).not.toHaveBeenCalled();
    expect(api.deleteRegistration).not.toHaveBeenCalled();
  });
  it('opens all event participants, including teammates, from a dashboard card', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    const record = (await api.fetchRegistrations())[0]!;
    vi.mocked(api.fetchRegistrations).mockResolvedValue([{ ...record, selected_events: ['code-canvas'], team_members: [{ name: 'Test Teammate', rrn: '456', mobile: '0123456789', programme: 'M.Tech', year: 'II', department: 'AI&DS', section: 'B', event_id: 'code-canvas' }] }]);
    render(<AdminPage onBack={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'View Code Canvas participants' }));
    const dialog = await screen.findByRole('dialog', { name: 'Code Canvas participants' });
    expect(within(dialog).getByText('Test Participant', { exact: true })).toBeInTheDocument();
    expect(within(dialog).getByText('Test Teammate', { exact: true })).toBeInTheDocument();
    expect(within(dialog).getAllByText('TEST', { exact: true })).toHaveLength(2);
    expect(within(dialog).getByText('Total participants: 2')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Export all participants CSV' })).toBeEnabled();
    expect(within(dialog).getByRole('button', { name: 'Export participants Excel' })).toBeEnabled();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Search event participants' }), { target: { value: '456' } });
    expect(within(dialog).queryByText('Test Participant', { exact: true })).not.toBeInTheDocument();
    expect(within(dialog).getByText('Test Teammate', { exact: true })).toBeInTheDocument();
  });
  it('offers dashboard, read-only roster and academic counts to the registration team', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'registration' });
    render(<AdminPage registrationOnly onBack={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Dashboard Overview' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Website CMS & Cards' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supabase Cloud Config' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Duplicates' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrations Roster/ }));
    expect(await screen.findByText('Test Participant')).toBeInTheDocument();
    expect(screen.queryByTitle('Delete entry')).not.toBeInTheDocument();
    expect(api.fetchRegistrations).toHaveBeenCalledWith('registration');
    fireEvent.click(screen.getByRole('button', { name: 'Department & Section Counts' }));
    expect(await screen.findByRole('heading', { name: 'Programme, year & section counts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'B.Tech · 2nd year' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'M.Tech' })).toBeInTheDocument();
  });
  it('retains editing, database settings and delete controls for main admin', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    render(<AdminPage onBack={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Website CMS & Cards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supabase Cloud Config' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrations Roster/ }));
    expect(await screen.findByTitle('Delete entry')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Department & Section Counts' }));
    expect(await screen.findByRole('heading', { name: 'Programme, year & section counts' })).toBeInTheDocument();
  });
  it('does not accept a registration-team session in the main portal', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'registration' });
    render(<AdminPage onBack={() => {}} />);
    expect(await screen.findByPlaceholderText('Enter admin passcode')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Website CMS & Cards' })).not.toBeInTheDocument();
  });
  it('confirms deletion and removes only the selected registration after the server succeeds', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    const records = await api.fetchRegistrations();
    vi.mocked(api.fetchRegistrations).mockResolvedValue([...records, { ...records[0]!, reg_id: 'KEEP', name: 'Other Participant', rrn: '456' }]);
    vi.mocked(api.deleteRegistration).mockResolvedValue(true);
    render(<AdminPage onBack={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Registrations Roster/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete registration TEST' }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Test Participant (TEST)');
    expect(api.deleteRegistration).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(api.deleteRegistration).toHaveBeenCalledWith('TEST'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete registration TEST' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Delete registration KEEP' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrations Roster 1' })).toBeInTheDocument();
  });
  it('keeps the record and shows an error when the database deletion fails', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    vi.mocked(api.deleteRegistration).mockRejectedValue(new Error('Database unavailable'));
    render(<AdminPage onBack={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Registrations Roster/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete registration TEST' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Keep registration' }));
    expect(await screen.findByRole('button', { name: 'Delete registration TEST' })).toBeInTheDocument();
  });
});
