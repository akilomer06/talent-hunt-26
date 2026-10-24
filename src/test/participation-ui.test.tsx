import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AdminPage } from '../pages/AdminPage';
import { ParticipationStatus } from '../components/ParticipationStatus';
import * as api from '../lib/supabase';
import { EVENTS } from '../data/eventsData';

vi.mock('../lib/supabase', async importOriginal => ({ ...await importOriginal<typeof import('../lib/supabase')>(), checkAdminSession: vi.fn(), fetchRegistrations: vi.fn(), fetchLiveSiteContent: vi.fn(), checkBackendHealth: vi.fn(), deleteRegistration: vi.fn(), updateRegistration: vi.fn(), createAdminRegistration: vi.fn(), fetchParticipation: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
const person = (rrn: string) => ({ name: `Person ${rrn}`, rrn, mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A' });
const records = [
  { ...person('001'), reg_id: 'TECH', selected_events: ['code-canvas'], team_members: [] },
  { ...person('002'), reg_id: 'TEAM', selected_events: ['bgmi'], team_members: ['003', '004', '005', '001'].map(rrn => ({ ...person(rrn), event_id: 'bgmi' })) },
  { ...person('006'), reg_id: 'THIRD', selected_events: ['trashion'], team_members: [{ ...person('001'), event_id: 'trashion' }] },
];
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchRegistrations).mockResolvedValue(records);
  vi.mocked(api.fetchLiveSiteContent).mockResolvedValue({ events: EVENTS, settings: api.DEFAULT_SITE_SETTINGS });
  vi.mocked(api.checkBackendHealth).mockResolvedValue(true);
});

describe('new admin participation views', () => {
  it.each([false, true])('shows grouped teams and downloads in both portals, with admin-only excess access (%s)', async registrationOnly => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: registrationOnly ? 'registration' : 'admin' });
    render(<AdminPage registrationOnly={registrationOnly} onBack={() => {}} />);
    const groupsButton = await screen.findByRole('button', { name: 'Event Groups' });
    await waitFor(() => expect(api.fetchRegistrations).toHaveBeenCalled());
    expect(!!screen.queryByRole('button', { name: '3+ Events Participants' })).toBe(!registrationOnly);
    fireEvent.click(groupsButton);
    const group = screen.getByRole('region', { name: 'BGMI Championship groups' });
    expect(within(group).getByText('Substitute', { exact: true })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Download BGMI Championship Excel' })).toBeEnabled();
    expect(within(group).getByRole('button', { name: 'Download BGMI Championship Attendance & Signature Sheet' })).toBeEnabled();
    expect(within(group).getByText(/10 extra rows for on-the-spot registration/)).toBeInTheDocument();
    expect(within(group).getByText('Registrant · Main player', { exact: true })).toBeInTheDocument();
    if (!registrationOnly) {
      fireEvent.click(screen.getByRole('button', { name: '3+ Events Participants' }));
      const excess = screen.getByRole('region', { name: '3+ Events Participants' });
      expect(within(excess).getByText('Person 001 · RRN 001')).toBeInTheDocument();
      expect(within(excess).getAllByRole('button', { name: 'Remove this teammate (review)' })).toHaveLength(2);
      fireEvent.click(within(excess).getAllByRole('button', { name: 'Edit source registration' })[0]!);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    }
    expect(api.updateRegistration).not.toHaveBeenCalled();
    expect(api.createAdminRegistration).not.toHaveBeenCalled();
    expect(api.deleteRegistration).not.toHaveBeenCalled();
  });
  it('opens Event Groups within the event participants dialog', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'registration' });
    render(<AdminPage registrationOnly onBack={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'View BGMI Championship participants' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Event Groups' }));
    expect(within(dialog).getByRole('region', { name: 'BGMI Championship groups' })).toBeInTheDocument();
    expect(within(dialog).getByText('Substitute', { exact: true })).toBeInTheDocument();
  });
  it('removes only a reviewed teammate membership and synchronizes excess, roster and event groups', async () => {
    vi.mocked(api.checkAdminSession).mockResolvedValue({ role: 'admin' });
    const source = records[2]!;
    const corrected = { ...source, team_members: [] };
    vi.mocked(api.updateRegistration).mockResolvedValue(corrected);
    render(<AdminPage onBack={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: '3+ Events Participants' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove this teammate (review)' })[1]!);
    expect(api.updateRegistration).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
    expect(api.updateRegistration).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and save changes' }));
    await waitFor(() => expect(api.updateRegistration).toHaveBeenCalledWith(corrected, source));
    expect(await screen.findByText('No participants associated with three or more events.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Event Groups' }));
    const trashion = screen.getByRole('region', { name: 'Trashion groups' });
    expect(within(trashion).getByText('Person 006', { exact: true })).toBeInTheDocument();
    expect(within(trashion).queryByText('Person 001', { exact: true })).not.toBeInTheDocument();
    const bgmi = screen.getByRole('region', { name: 'BGMI Championship groups' });
    expect(within(bgmi).getByText('Person 001', { exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrations Roster/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search registrations and teammates' }), { target: { value: '001' } });
    expect(screen.getByText('Person 001', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('Person 006', { exact: true })).not.toBeInTheDocument();
    expect(api.deleteRegistration).not.toHaveBeenCalled();
    expect(api.createAdminRegistration).not.toHaveBeenCalled();
  });
});

describe('registration participation lookup', () => {
  it('shows existing events for every role and discards responses for a previously typed RRN', async () => {
    let resolveOld: (value: Record<string, api.ParticipationEvent[]>) => void = () => {};
    vi.mocked(api.fetchParticipation).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    vi.mocked(api.fetchParticipation).mockResolvedValueOnce({ '002': [
      { id: 'code-canvas', title: 'Code Canvas', category: 'technical', roles: ['Teammate'], uncertain: false },
      { id: 'bgmi', title: 'BGMI Championship', category: 'non-technical', roles: ['Substitute'], uncertain: false },
    ] });
    const { rerender } = render(<ParticipationStatus rrn="001" />);
    await waitFor(() => expect(api.fetchParticipation).toHaveBeenCalledWith(['001']), { timeout: 2000 });
    rerender(<ParticipationStatus rrn="0 0 2" />);
    expect(await screen.findByText(/BGMI Championship · Non-Technical · Substitute/, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByText(/Maximum event limit reached/)).toBeInTheDocument();
    resolveOld({ '001': [] });
    await waitFor(() => expect(screen.queryByText('No existing events found.')).not.toBeInTheDocument());
    expect(screen.getByText(/Code Canvas · Technical · Teammate/)).toBeInTheDocument();
  });
});
