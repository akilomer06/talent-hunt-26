import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminPage } from '../pages/AdminPage';
import * as api from '../lib/supabase';
import { EVENTS } from '../data/eventsData';

vi.mock('../lib/supabase', async importOriginal => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  return { ...actual, checkAdminSession: vi.fn(), fetchRegistrations: vi.fn(), fetchLiveSiteContent: vi.fn(), checkBackendHealth: vi.fn(), deleteRegistration: vi.fn() };
});
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchRegistrations).mockResolvedValue([{ reg_id: 'TEST', name: 'Test Participant', rrn: '123', mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'IoT', selected_events: ['tech-talks'], team_members: [] }]);
  vi.mocked(api.fetchLiveSiteContent).mockResolvedValue({ events: EVENTS, settings: api.DEFAULT_SITE_SETTINGS });
  vi.mocked(api.checkBackendHealth).mockResolvedValue(true);
});
describe('separate admin portals', () => {
  it('offers only dashboard and read-only roster to the registration team', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'registration' });
    render(<AdminPage registrationOnly onBack={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Dashboard Overview' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Website CMS & Cards' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supabase Cloud Config' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrations Roster/ }));
    expect(await screen.findByText('Test Participant')).toBeInTheDocument();
    expect(screen.queryByTitle('Delete entry')).not.toBeInTheDocument();
    expect(api.fetchRegistrations).toHaveBeenCalledWith('registration');
  });
  it('retains editing, database settings and delete controls for main admin', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    render(<AdminPage onBack={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Website CMS & Cards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supabase Cloud Config' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrations Roster/ }));
    expect(await screen.findByTitle('Delete entry')).toBeInTheDocument();
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
