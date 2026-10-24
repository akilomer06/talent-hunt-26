import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EVENTS } from '../data/eventsData';
import { RegisterPage } from '../pages/RegisterPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { RegistrationSection } from '../components/RegistrationSection';
import { RegistrationModal } from '../components/RegistrationModal';

vi.mock('../hooks/useLiveContent', () => ({ useLiveContent: () => ({ events: EVENTS, settings: {} }) }));
afterEach(cleanup);

it('replaces online registration with a capacity-dependent on-the-spot notice and all venues', () => {
  render(<RegisterPage onBack={() => {}} />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Online registration is closed');
  expect(screen.getByText(/number of students already registered/)).toHaveTextContent('remaining capacity');
  expect(screen.getByText(/A place is not guaranteed/)).toBeInTheDocument();
  expect(screen.getByText(/Your existing registration remains valid/)).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /submit|confirm registration/i })).not.toBeInTheDocument();
  expect(screen.getAllByRole('term')).toHaveLength(16);
  expect(screen.getByText('Seminar Hall CSE 1st Floor')).toBeInTheDocument();
  expect(within(screen.getByRole('complementary', { name: 'Registration help' })).getByRole('link')).toHaveAttribute('href', 'tel:+917338985189');
});

it.each(EVENTS)('blocks both register buttons on the $title detail page', event => {
  const register = vi.fn();
  render(<EventDetailPage eventId={event.id} onBack={() => {}} onNavigateEvent={() => {}} onRegisterEvent={register} />);
  const buttons = screen.getAllByRole('button', { name: 'Registration closed' });
  expect(buttons).toHaveLength(2);
  buttons.forEach(button => { expect(button).toBeDisabled(); fireEvent.click(button); });
  expect(register).not.toHaveBeenCalled();
  expect(screen.getByText(/On-the-spot registration may be available/)).toBeInTheDocument();
});

it('does not reopen registration through a direct preselected event link', () => {
  render(<RegisterPage initialEventId="code-break" onBack={() => {}} />);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByText('Online registration has closed for all 16 events.')).toBeInTheDocument();
});

it('shows the closed status and conditional campus registration on the home section and modal', () => {
  const navigate = vi.fn();
  render(<RegistrationSection onOpenModal={() => {}} onRegister={navigate} />);
  fireEvent.click(screen.getByRole('button', { name: /View on-the-spot registration/ }));
  expect(navigate).toHaveBeenCalledOnce();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  cleanup();
  render(<RegistrationModal isOpen onClose={() => {}} />);
  expect(screen.getByRole('dialog')).toHaveTextContent('Online registration is closed');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
