import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EVENTS } from '../data/eventsData';
import { RegisterPage } from '../pages/RegisterPage';

vi.mock('../hooks/useLiveContent', () => ({ useLiveContent: () => ({ events: EVENTS, settings: {} }) }));
afterEach(cleanup);

describe('dynamic event team form', () => {
  it('opens one teammate, allows additions up to the maximum, and supports a separate second team', () => {
    render(<RegisterPage initialEventId="code-break" onBack={() => {}} />);
    const code = screen.getByRole('region', { name: 'Code Break team' });
    expect(within(code).getAllByRole('textbox', { name: 'Name *' })).toHaveLength(1);
    fireEvent.click(within(code).getByRole('button', { name: 'Add Code Break teammate' }));
    fireEvent.click(within(code).getByRole('button', { name: 'Add Code Break teammate' }));
    expect(within(code).getAllByRole('textbox', { name: 'Name *' })).toHaveLength(3);
    expect(within(code).queryByRole('button', { name: 'Add Code Break teammate' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clue Code' }));
    expect(screen.getByRole('region', { name: 'Clue Code team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Code Canvas' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'FIFA' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Code Break' }));
    expect(screen.queryByRole('region', { name: 'Code Break team' })).not.toBeInTheDocument();
  });
  it('shows no teammate fields for individual events', () => {
    render(<RegisterPage initialEventId="tech-talks" onBack={() => {}} />);
    const region = screen.getByRole('region', { name: 'Tech Talks team' });
    expect(within(region).getByText(/No teammates needed/)).toBeInTheDocument();
    expect(within(region).queryByRole('textbox')).not.toBeInTheDocument();
  });
});
