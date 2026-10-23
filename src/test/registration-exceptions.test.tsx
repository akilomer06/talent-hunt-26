import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationEditor } from '../components/RegistrationEditor';
import { EVENTS } from '../data/eventsData';
import * as api from '../lib/supabase';

vi.mock('../lib/supabase', async original => ({ ...await original<typeof import('../lib/supabase')>(), fetchRegistrationExceptions: vi.fn(), createAdminRegistration: vi.fn() }));
const draft: api.RegistrationRecord = { reg_id: '', name: 'Test Student', rrn: '240181601070', mobile: '9000000000', programme: 'B.Tech', year: 'III', department: 'Cybersecurity', section: '', selected_events: [], team_members: [] };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(() => vi.clearAllMocks());

it('unlocks only the approved closed event, requires review and waits for persistence', async () => {
  vi.stubGlobal('crypto', { randomUUID: () => '01234567-89ab-cdef-0123-456789abcdef' });
  vi.mocked(api.fetchRegistrationExceptions).mockResolvedValue(['fifa']);
  vi.mocked(api.createAdminRegistration).mockResolvedValue({ ...draft, reg_id: 'SAVED', selected_events: ['fifa'] });
  const saved = vi.fn();
  render(<RegistrationEditor request={{ initial: draft }} events={EVENTS} onClose={vi.fn()} onSaved={saved} />);
  expect(screen.getByRole('checkbox', { name: /^FIFA/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Check closed-event exception' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Public registration remains closed');
  expect(api.fetchRegistrationExceptions).toHaveBeenCalledWith(draft.rrn);
  expect(screen.getByRole('checkbox', { name: /^FIFA/ })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: /^Bid Wars/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /^FIFA/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(api.createAdminRegistration).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and create registration' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ reg_id: 'SAVED' })));
  expect(api.createAdminRegistration).toHaveBeenCalledWith(expect.objectContaining({ rrn: draft.rrn, selected_events: ['fifa'], section: '' }), '0123456789abcdef0123456789abcdef');
});

it('invalidates an exception when the RRN changes and prevents saving the selected closed event', async () => {
  vi.mocked(api.fetchRegistrationExceptions).mockResolvedValue(['fifa']);
  render(<RegistrationEditor request={{ initial: draft }} events={EVENTS} onClose={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Check closed-event exception' }));
  await screen.findByRole('status');
  fireEvent.click(screen.getByRole('checkbox', { name: /^FIFA/ }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Registrant RRN' }), { target: { value: 'OTHER' } });
  expect(screen.getByRole('checkbox', { name: /^FIFA/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Registration is closed for FIFA');
  expect(api.createAdminRegistration).not.toHaveBeenCalled();
});

it('keeps closed events disabled if approval lookup fails or no exception exists', async () => {
  vi.mocked(api.fetchRegistrationExceptions).mockRejectedValueOnce(new Error('Sign in again')).mockResolvedValueOnce([]);
  render(<RegistrationEditor request={{ initial: draft }} events={EVENTS} onClose={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Check closed-event exception' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sign in again');
  fireEvent.click(screen.getByRole('button', { name: 'Check closed-event exception' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No closed-event exception'));
  expect(screen.getByRole('checkbox', { name: /^FIFA/ })).toBeDisabled();
});
