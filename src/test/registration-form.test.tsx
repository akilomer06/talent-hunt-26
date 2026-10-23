import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EVENTS } from '../data/eventsData';
import { RegisterPage } from '../pages/RegisterPage';
import { EventDetailPage } from '../pages/EventDetailPage';

vi.mock('../hooks/useLiveContent', () => ({ useLiveContent: () => ({ events: EVENTS, settings: {} }) }));
afterEach(cleanup);

describe('dynamic event team form', () => {
  it.each(['fifa', 'bid-wars'])('disables closed registration and rejects a preselected %s link', eventId => {
    render(<RegisterPage initialEventId={eventId} onBack={() => {}} />);
    expect(screen.getByRole('button', { name: 'FIFA' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bid Wars' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Shutter Verse' })).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Registration is closed');
    expect(screen.queryByRole('region', { name: /FIFA team|Bid Wars team/ })).not.toBeInTheDocument();
  });
  it.each(['fifa', 'bid-wars'])('disables both registration buttons on the %s detail page', eventId => {
    const register = vi.fn();
    render(<EventDetailPage eventId={eventId} onBack={() => {}} onNavigateEvent={() => {}} onRegisterEvent={register} />);
    const buttons = screen.getAllByRole('button', { name: 'Registration closed' });
    expect(buttons).toHaveLength(2);
    buttons.forEach(button => { expect(button).toBeDisabled(); fireEvent.click(button); });
    expect(register).not.toHaveBeenCalled();
  });
  it('explains event/RRN uniqueness and provides the registration-help phone link', () => {
    render(<RegisterPage onBack={() => {}} />);
    const help = screen.getByRole('complementary', { name: 'Registration help' });
    expect(help).toHaveTextContent('Each RRN can join an event only once, as registrant or teammate.');
    expect(within(help).getByRole('link', { name: 'Vijay Hari · +91 733 898 5189' })).toHaveAttribute('href', 'tel:+917338985189');
  });
  it('makes formerly required teammates optional and supports a separate second team', () => {
    render(<RegisterPage initialEventId="code-break" onBack={() => {}} />);
    const code = screen.getByRole('region', { name: 'Code Break team' });
    expect(within(code).queryByRole('textbox', { name: 'Name *' })).not.toBeInTheDocument();
    fireEvent.click(within(code).getByRole('button', { name: 'Add Code Break teammate' }));
    expect(within(code).getAllByRole('textbox', { name: 'Name *' })).toHaveLength(1);
    fireEvent.click(within(code).getByRole('button', { name: 'Remove Code Break teammate 1' }));
    expect(within(code).queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clue Code' }));
    expect(screen.getByRole('region', { name: 'Clue Code team' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Clue Code team' })).queryByRole('textbox', { name: 'Name *' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Code Canvas' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'FIFA' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Code Break' }));
    expect(screen.queryByRole('region', { name: 'Code Break team' })).not.toBeInTheDocument();
  });
  it('starts with no teammates and allows removing every optional slot within the maximum', () => {
    render(<RegisterPage initialEventId="bgmi" onBack={() => {}} />);
    const team = screen.getByRole('region', { name: 'BGMI Championship team' });
    expect(within(team).queryByRole('textbox')).not.toBeInTheDocument();
    for (let i = 0; i < 4; i++) fireEvent.click(within(team).getByRole('button', { name: 'Add BGMI Championship teammate' }));
    expect(within(team).getAllByRole('textbox', { name: 'Name *' })).toHaveLength(4);
    expect(within(team).getByText('Optional substitute')).toBeInTheDocument();
    expect(within(team).queryByRole('button', { name: 'Add BGMI Championship teammate' })).not.toBeInTheDocument();
    fireEvent.click(within(team).getByRole('button', { name: 'Remove BGMI Championship teammate 4' }));
    expect(within(team).getAllByRole('textbox', { name: 'Name *' })).toHaveLength(3);
    for (let i = 3; i > 0; i--) fireEvent.click(within(team).getByRole('button', { name: `Remove BGMI Championship teammate ${i}` }));
    expect(within(team).queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('starts solo-capable events without teammates and allows adding and removing one', () => {
    render(<RegisterPage initialEventId="code-canvas" onBack={() => {}} />);
    const team = screen.getByRole('region', { name: 'Code Canvas team' });
    expect(within(team).queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(within(team).getByRole('button', { name: 'Add Code Canvas teammate' }));
    expect(within(team).getAllByRole('textbox', { name: 'Name *' })).toHaveLength(1);
    fireEvent.click(within(team).getByRole('button', { name: 'Remove Code Canvas teammate 1' }));
    expect(within(team).queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('shows no teammate fields for individual events', () => {
    render(<RegisterPage initialEventId="tech-talks" onBack={() => {}} />);
    const region = screen.getByRole('region', { name: 'Tech Talks team' });
    expect(within(region).getByText(/No teammates needed/)).toBeInTheDocument();
    expect(within(region).queryByRole('textbox')).not.toBeInTheDocument();
  });
});
