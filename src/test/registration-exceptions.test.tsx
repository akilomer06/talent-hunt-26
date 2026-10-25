import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationEditor } from '../components/RegistrationEditor';
import { EVENTS } from '../data/eventsData';
import * as api from '../lib/supabase';

vi.mock('../lib/supabase', async original => ({ ...await original<typeof import('../lib/supabase')>(), fetchRegistrationExceptions: vi.fn(), createAdminRegistration: vi.fn(), updateRegistration: vi.fn() }));
const draft: api.RegistrationRecord = { reg_id: '', name: 'Test Student', rrn: '240071603001', mobile: '9000000000', programme: 'B.Tech', year: 'III', department: 'CSE', section: 'A', selected_events: ['fifa'], team_members: [] };
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

it('cannot use a former FIFA exception or create a preselected closed event', () => {
  render(<RegistrationEditor request={{ initial: draft }} events={EVENTS} onClose={vi.fn()} onSaved={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Check closed-event exception' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('checkbox')).toHaveLength(16);
  screen.getAllByRole('checkbox').forEach(checkbox => expect(checkbox).toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Online registration is closed for this event');
  expect(api.createAdminRegistration).not.toHaveBeenCalled();
  expect(api.fetchRegistrationExceptions).not.toHaveBeenCalled();
});

it('preserves existing passes while allowing personal-detail corrections', async () => {
  const original = { ...draft, reg_id: 'KEEP' };
  vi.mocked(api.updateRegistration).mockResolvedValue({ ...original, name: 'Corrected Student' });
  const saved = vi.fn();
  render(<RegistrationEditor request={{ initial: original, original }} events={EVENTS} onClose={vi.fn()} onSaved={saved} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Registrant Name' }), { target: { value: 'Corrected Student' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(api.updateRegistration).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and save changes' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ reg_id: 'KEEP', selected_events: ['fifa'] })));
});

it('does not transfer an existing closed-event pass to a different RRN', () => {
  const original = { ...draft, reg_id: 'KEEP' };
  render(<RegistrationEditor request={{ initial: original, original }} events={EVENTS} onClose={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Registrant RRN' }), { target: { value: 'OTHER' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Online registration is closed for this event');
  expect(api.updateRegistration).not.toHaveBeenCalled();
});
