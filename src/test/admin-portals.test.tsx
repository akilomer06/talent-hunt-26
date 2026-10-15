import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AdminPage } from '../pages/AdminPage';
import * as api from '../lib/supabase';
import { EVENTS } from '../data/eventsData';

vi.mock('../lib/supabase', async importOriginal => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  return { ...actual, checkAdminSession: vi.fn(), fetchRegistrations: vi.fn(), fetchLiveSiteContent: vi.fn(), checkBackendHealth: vi.fn() };
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
});
