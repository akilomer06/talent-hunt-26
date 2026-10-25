import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

it.each([undefined, 'trashion', 'fifa'])('closes the registration route and direct links (%s), retaining venues and on-the-spot information', initialEventId => {
  render(<RegisterPage {...(initialEventId ? { initialEventId } : {})} onBack={() => {}} />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Online registration is closed');
  expect(screen.getByText('Online registration is closed for all events.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Confirm registration' })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByText(/number of students already registered/)).toHaveTextContent('remaining capacity');
  expect(screen.getAllByRole('term')).toHaveLength(16);
  expect(within(screen.getByRole('complementary', { name: 'Registration help' })).getByRole('link')).toHaveAttribute('href', 'tel:+917338985189');
  expect(submitRegistration).not.toHaveBeenCalled();
});

it.each(EVENTS)('keeps both register buttons closed on the $title detail page', event => {
  const register = vi.fn();
  render(<EventDetailPage eventId={event.id} onBack={() => {}} onNavigateEvent={() => {}} onRegisterEvent={register} />);
  const buttons = screen.getAllByRole('button', { name: 'Registration closed' });
  expect(buttons).toHaveLength(2);
  buttons.forEach(button => { expect(button).toBeDisabled(); fireEvent.click(button); });
  expect(register).not.toHaveBeenCalled();
  expect(screen.getByText(/On-the-spot registration may be available/)).toBeInTheDocument();
});

it('shows the all-event closure and venue information on the home section and modal', () => {
  const navigate = vi.fn();
  render(<RegistrationSection onOpenModal={() => {}} onRegister={navigate} />);
  expect(screen.getByRole('heading')).toHaveTextContent('Online registration is closed');
  fireEvent.click(screen.getByRole('button', { name: 'View venues and registration information' }));
  expect(navigate).toHaveBeenCalledOnce();
  cleanup();
  render(<RegistrationModal isOpen onClose={() => {}} />);
  expect(screen.getByRole('dialog')).toHaveTextContent('Online registration is closed for all events.');
  expect(screen.getByRole('dialog')).toHaveTextContent('remaining capacity');
});
