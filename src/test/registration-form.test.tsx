import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { EVENTS } from '../data/eventsData';
import { RegisterPage } from '../pages/RegisterPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { RegistrationSection } from '../components/RegistrationSection';
import { RegistrationModal } from '../components/RegistrationModal';
import { submitRegistration } from '../lib/supabase';

vi.mock('../hooks/useLiveContent', () => ({ useLiveContent: () => ({ events: EVENTS, settings: {} }) }));
vi.mock('../components/ParticipationStatus', () => ({ ParticipationStatus: () => null }));
vi.mock('../lib/supabase', async original => ({ ...await original<typeof import('../lib/supabase')>(), submitRegistration: vi.fn() }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('opens only Trashion, preserving the other-event notice and all final venues', () => {
  render(<RegisterPage onBack={() => {}} />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Register for Trashion');
  expect(screen.getByRole('button', { name: 'Trashion' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('button', { name: 'FIFA' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Code Break' })).not.toBeInTheDocument();
  expect(screen.getByText(/number of students already registered/)).toHaveTextContent('remaining capacity');
  expect(screen.getByRole('button', { name: 'Confirm registration' })).toBeEnabled();
  expect(screen.getAllByRole('term')).toHaveLength(16);
  expect(within(screen.getByRole('complementary', { name: 'Registration help' })).getByRole('link')).toHaveAttribute('href', 'tel:+917338985189');
});

it.each(EVENTS.filter(event => event.id !== 'trashion'))('keeps both register buttons closed on the $title detail page', event => {
  const register = vi.fn();
  render(<EventDetailPage eventId={event.id} onBack={() => {}} onNavigateEvent={() => {}} onRegisterEvent={register} />);
  const buttons = screen.getAllByRole('button', { name: 'Registration closed' });
  expect(buttons).toHaveLength(2);
  buttons.forEach(button => { expect(button).toBeDisabled(); fireEvent.click(button); });
  expect(register).not.toHaveBeenCalled();
  expect(screen.getByText(/On-the-spot registration may be available/)).toBeInTheDocument();
});

it('enables registration on the Trashion event page', () => {
  const register = vi.fn();
  render(<EventDetailPage eventId="trashion" onBack={() => {}} onNavigateEvent={() => {}} onRegisterEvent={register} />);
  fireEvent.click(screen.getByRole('button', { name: 'Register for Trashion' }));
  expect(register).toHaveBeenCalledWith('trashion');
  expect(screen.queryByRole('button', { name: 'Registration closed' })).not.toBeInTheDocument();
});

it('ignores a closed event in a direct link and selects only Trashion', () => {
  render(<RegisterPage initialEventId="code-break" onBack={() => {}} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Only Trashion remains open online');
  expect(screen.getByRole('button', { name: 'Trashion' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('region', { name: 'Code Break team' })).not.toBeInTheDocument();
});

it('allows at most four optional Trashion teammates', () => {
  render(<RegisterPage onBack={() => {}} />);
  for(let index = 0; index < 4; index++) fireEvent.click(screen.getByRole('button', { name: 'Add Trashion teammate' }));
  expect(screen.queryByRole('button', { name: 'Add Trashion teammate' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('textbox', { name: /^Name/ })).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Trashion teammate 4' }));
  expect(screen.getByRole('button', { name: 'Add Trashion teammate' })).toBeEnabled();
});

it('submits only Trashion and shows a pass after the server confirms persistence', async () => {
  vi.mocked(submitRegistration).mockResolvedValue({ success: true, data: {} as never });
  render(<RegisterPage onBack={() => {}} />);
  fireEvent.change(screen.getByRole('textbox', { name: /^Name/ }), { target: { value: 'Test Student' } });
  fireEvent.change(screen.getByRole('textbox', { name: /^RRN/ }), { target: { value: '001' } });
  fireEvent.change(screen.getByRole('textbox', { name: /^Mobile number/ }), { target: { value: '9000000000' } });
  fireEvent.change(screen.getByRole('combobox', { name: /^Programme/ }), { target: { value: 'B.Tech' } });
  fireEvent.change(screen.getByRole('combobox', { name: /^Year of study/ }), { target: { value: 'III' } });
  fireEvent.change(screen.getByRole('combobox', { name: /^Department/ }), { target: { value: 'CSE' } });
  fireEvent.change(screen.getByRole('combobox', { name: /^Section/ }), { target: { value: 'A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm registration' }));
  await waitFor(() => expect(submitRegistration).toHaveBeenCalledWith(expect.objectContaining({ selected_events: ['trashion'], team_members: [], rrn: '001' })));
  expect(await screen.findByText('Official entry registered')).toBeInTheDocument();
});

it('advertises Trashion registration on the home section and modal', () => {
  const navigate = vi.fn();
  render(<RegistrationSection onOpenModal={() => {}} onRegister={navigate} />);
  fireEvent.click(screen.getByRole('button', { name: 'Register for Trashion' }));
  expect(navigate).toHaveBeenCalledOnce();
  cleanup();
  render(<RegistrationModal isOpen onClose={() => {}} />);
  expect(screen.getByRole('dialog')).toHaveTextContent('Trashion registration is open');
  expect(screen.getByRole('dialog')).toHaveTextContent('All other events remain closed');
});
