import { afterEach, expect, it, vi } from 'vitest';
import { EVENTS } from '../data/eventsData';
import { fetchLiveSiteContent, getCachedEvents } from '../lib/supabase';
import { apiRequest } from '../lib/api';
import { applyEventVenues } from '../../shared/eventVenues';

vi.mock('../lib/api', () => ({ apiRequest: vi.fn() }));
afterEach(() => { localStorage.clear(); vi.clearAllMocks(); });

it('matches all 16 organiser-provided venue assignments', () => {
  expect(EVENTS.map(event => [event.id, event.venue])).toEqual([
    ['code-break', 'LH 003'], ['code-canvas', 'IoT Lab'], ['neural-nexus', 'Geeks Lab'],
    ['binary-battle', 'ES 304'], ['game-craft', 'Seminar Hall CSE 1st Floor'],
    ['tech-talks', 'LH 001'], ['cyber-breach', 'AI&ML Lab'], ['prompt-pop', 'Web Tech Lab'],
    ['shutter-verse', 'LH 002'], ['clue-code', 'Web Tech Lab'], ['trashion', 'Auditorium'],
    ['the-voice-over', 'LH 003'], ['bgmi', 'LH 001'], ['fifa', 'IoT Lab'],
    ['valorant', 'Geeks Lab'], ['bid-wars', 'AI&ML Lab'],
  ]);
});

it('refreshes old browser caches and remote venues while retaining unrelated event content', async () => {
  const old = EVENTS.map(event => ({ ...event, venue: 'Old room', shortDesc: 'Organiser update' }));
  localStorage.setItem('th26_events_cache', JSON.stringify(old));
  expect(getCachedEvents().find(event => event.id === 'fifa')?.venue).toBe('IoT Lab');
  vi.mocked(apiRequest).mockResolvedValue([{ key: 'events', value: old }]);
  const current = await fetchLiveSiteContent();
  expect(current.events.find(event => event.id === 'tech-talks')?.venue).toBe('LH 001');
  expect(current.events.filter(event => event.id !== 'trashion').every(event => event.shortDesc === 'Organiser update')).toBe(true);
  expect(current.events.find(event => event.id === 'trashion')?.shortDesc).toContain('retro-themed fashion show');
  expect(old.every(event => event.venue === 'Old room')).toBe(true);
  expect(applyEventVenues([{ id: 'unknown', venue: 'Other venue' }])).toEqual([{ id: 'unknown', venue: 'Other venue' }]);
});
