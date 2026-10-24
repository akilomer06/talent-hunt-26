// Final event venues supplied by the organisers on 24 October 2026.
// Apply to remote content and older caches as well as the bundled event data.
export const EVENT_VENUES: Readonly<Record<string, string>> = {
  'code-break': 'LH 003',
  'code-canvas': 'IoT Lab',
  'neural-nexus': 'Geeks Lab',
  'binary-battle': 'ES 304',
  'game-craft': 'Seminar Hall CSE 1st Floor',
  'tech-talks': 'LH 001',
  'cyber-breach': 'AI&ML Lab',
  'prompt-pop': 'Web Tech Lab',
  'shutter-verse': 'LH 002',
  'clue-code': 'Web Tech Lab',
  trashion: 'Auditorium',
  'the-voice-over': 'LH 003',
  bgmi: 'LH 001',
  fifa: 'IoT Lab',
  valorant: 'Geeks Lab',
  'bid-wars': 'AI&ML Lab',
};

export function applyEventVenues<T extends { id: string; venue?: string }>(events: T[]): T[] {
  return events.map(event => EVENT_VENUES[event.id] ? { ...event, venue: EVENT_VENUES[event.id] } : event);
}
