import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationDuplicates } from '../components/RegistrationDuplicates';
import { RegistrationEditor } from '../components/RegistrationEditor';
import * as api from '../lib/supabase';
import { EVENTS } from '../data/eventsData';
import { withoutRegistrationEvent } from '../lib/registrationDuplicates';

vi.mock('../lib/supabase', async original => ({ ...await original<typeof import('../lib/supabase')>(), updateRegistration: vi.fn(), createAdminRegistration: vi.fn(), deleteRegistration: vi.fn() }));
const source: api.RegistrationRecord = { reg_id: 'KEEP-SOLO', name: 'Sample Student', rrn: '001', mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'A', selected_events: ['game-craft', 'fifa'], team_members: [{ event_id: 'game-craft', name: 'Sample Teammate', rrn: '002', mobile: '9000000001', programme: 'B.Tech', year: 'II', department: 'CSE', section: 'B' }], created_at: '2026-10-22T01:00:00Z' };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(() => vi.clearAllMocks());

it('opens every team detail, explains exact duplicate teams, and only creates local resolution drafts', () => {
  const edit = vi.fn(), remove = vi.fn();
  render(<RegistrationDuplicates records={[source, { ...source, reg_id: 'DUPLICATE', selected_events: ['game-craft'] }]} events={EVENTS} onEdit={edit} onDelete={remove} />);
  expect(screen.getAllByText('Sample Teammate', { exact: true })).toHaveLength(2);
  expect(screen.getAllByText('Exact duplicate').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Sample Student', { exact: true })).toHaveLength(2);
  expect(api.updateRegistration).not.toHaveBeenCalled();
  expect(api.createAdminRegistration).not.toHaveBeenCalled();
  expect(api.deleteRegistration).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Remove this event only' }));
  expect(edit.mock.calls[0]![0].initial.selected_events).toEqual(['fifa']);
  expect(edit.mock.calls[0]![0].initial.team_members).toEqual([]);
  expect(edit.mock.calls[0]![0].original).toEqual(source);
  fireEvent.click(screen.getAllByRole('button', { name: 'Create corrected registration for this event' })[0]!);
  expect(edit.mock.calls[1]![0].initial.selected_events).toEqual(['game-craft']);
  expect(edit.mock.calls[1]![0].initial.reg_id).toBe('');
  expect(edit.mock.calls[1]![0].initial.team_members[0].name).toBe('Sample Teammate');
  expect(remove).not.toHaveBeenCalled();
  expect(api.updateRegistration).not.toHaveBeenCalled();
});

it('requires review and explicit confirmation before saving an event-only resolution', async () => {
  const draft = withoutRegistrationEvent(source, 'game-craft');
  vi.mocked(api.updateRegistration).mockResolvedValue(draft);
  const saved = vi.fn();
  render(<RegistrationEditor request={{ initial: draft, original: source }} events={EVENTS} onClose={vi.fn()} onSaved={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(screen.getByText('Review before saving to the database')).toBeInTheDocument();
  expect(api.updateRegistration).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and save changes' }));
  await waitFor(() => expect(api.updateRegistration).toHaveBeenCalledWith(draft, source));
  expect(saved).toHaveBeenCalledWith(draft);
  expect(api.createAdminRegistration).not.toHaveBeenCalled();
  expect(api.deleteRegistration).not.toHaveBeenCalled();
});

it('keeps an edited draft open if saving fails and does not report a successful resolution', async () => {
  vi.mocked(api.updateRegistration).mockRejectedValue(new Error('This registration changed. Refresh.'));
  const saved = vi.fn();
  render(<RegistrationEditor request={{ initial: source, original: source }} events={EVENTS} onClose={vi.fn()} onSaved={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and save changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('This registration changed. Refresh.');
  expect(saved).not.toHaveBeenCalled();
});

it('creates a corrected pass only after confirmation and uses the same request ID on retry', async () => {
  vi.stubGlobal('crypto', { randomUUID: () => '01234567-89ab-cdef-0123-456789abcdef' });
  const { created_at, ...fields } = source;
  const draft = { ...fields, reg_id: '', selected_events: ['game-craft'] };
  vi.mocked(api.createAdminRegistration).mockRejectedValueOnce(new Error('Connection interrupted.')).mockResolvedValueOnce({ ...draft, reg_id: 'NEW-PASS' });
  const saved = vi.fn();
  render(<RegistrationEditor request={{ initial: draft }} events={EVENTS} onClose={vi.fn()} onSaved={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(api.createAdminRegistration).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and create registration' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted.');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and create registration' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.createAdminRegistration).toHaveBeenCalledTimes(2);
  expect(vi.mocked(api.createAdminRegistration).mock.calls.map(call => call[1])).toEqual(['0123456789abcdef0123456789abcdef', '0123456789abcdef0123456789abcdef']);
  expect(api.updateRegistration).not.toHaveBeenCalled();
  expect(api.deleteRegistration).not.toHaveBeenCalled();
});
