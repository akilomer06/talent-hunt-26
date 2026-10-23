export type EventCategory = 'technical' | 'non-technical';
export interface TeamRule {
  title: string;
  category: EventCategory;
  min: number;
  max: number;
  substitute?: boolean;
}

// Total participants including the registrant. Teammates are optional; event maximums still apply.
export const TEAM_RULES: Record<string, TeamRule> = {
  'code-break': { title: 'Code Break', category: 'technical', min: 1, max: 4 },
  'code-canvas': { title: 'Code Canvas', category: 'technical', min: 1, max: 2 },
  'neural-nexus': { title: 'Neural Nexus', category: 'technical', min: 1, max: 3 },
  'binary-battle': { title: 'Binary Battle', category: 'technical', min: 1, max: 3 },
  'game-craft': { title: 'Game Craft', category: 'technical', min: 1, max: 2 },
  'tech-talks': { title: 'Tech Talks', category: 'technical', min: 1, max: 1 },
  'cyber-breach': { title: 'Cyber Breach', category: 'technical', min: 1, max: 3 },
  'prompt-pop': { title: 'Prompt Pop', category: 'technical', min: 1, max: 2 },
  'shutter-verse': { title: 'Shutter Verse', category: 'non-technical', min: 1, max: 1 },
  'clue-code': { title: 'Clue Code', category: 'non-technical', min: 1, max: 3 },
  trashion: { title: 'Trashion', category: 'non-technical', min: 1, max: 5 },
  'the-voice-over': { title: 'The Voice Over', category: 'non-technical', min: 1, max: 3 },
  bgmi: { title: 'BGMI Championship', category: 'non-technical', min: 1, max: 5, substitute: true },
  fifa: { title: 'FIFA', category: 'non-technical', min: 1, max: 1 },
  valorant: { title: 'Valorant Tournament', category: 'non-technical', min: 1, max: 5 },
  'bid-wars': { title: 'Bid Wars', category: 'non-technical', min: 1, max: 4 },
};

export interface EventTeammate {
  event_id?: string;
  name: string;
  rrn: string;
  mobile: string;
  programme: string;
  year: string;
  department: string;
  section?: string;
}

/** Preserve leading zeroes; spaces and case must not bypass identity checks. */
export const normalizeRrn = (value: string) => value.replace(/\s+/g, '').toUpperCase();

export const REGISTRATION_HELP = 'For help, contact Vijay Hari at +91 733 898 5189.';

export const CLOSED_REGISTRATION_EVENTS: readonly string[] = ['bid-wars', 'fifa'];
export const isEventRegistrationClosed = (eventId: string) => CLOSED_REGISTRATION_EVENTS.includes(eventId);
export function closedRegistrationError(selected: string[], existing: string[] = []): string | null {
  const closed = selected.filter(id => isEventRegistrationClosed(id) && !existing.includes(id));
  return closed.length ? `Registration is closed for ${closed.map(id => TEAM_RULES[id]?.title || id).join(' and ')}. Please choose another event. ${REGISTRATION_HELP}` : null;
}

export function validateEventTeams(selected: string[], teammates: EventTeammate[], registrantRrn: string): string | null {
  if (selected.length < 1) return 'Pick at least one event.';
  const categories = new Set<EventCategory>();
  for (const id of selected) {
    const rule = TEAM_RULES[id];
    if (!rule) return 'Select a valid event.';
    if (categories.has(rule.category)) return 'You can select only one technical and one non-technical event.';
    categories.add(rule.category);
  }
  if (teammates.some(member => !member || !member.event_id || !selected.includes(member.event_id))) {
    return 'Each teammate must belong to a selected event.';
  }
  for (const id of selected) {
    const rule = TEAM_RULES[id]!;
    const members = teammates.filter(member => member.event_id === id);
    const total = 1 + members.length;
    if (total > rule.max) {
      return `${rule.title}: up to ${rule.max} participants allowed, including you (${rule.max - 1} teammates maximum).`;
    }
    const rrns = new Set([normalizeRrn(registrantRrn)]);
    for (const member of members) {
      if (![member.name, member.rrn, member.mobile, member.programme, member.year, member.department]
        .every(value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200)
        || !/^\d{10}$/.test(member.mobile)) return `${rule.title}: complete all teammate details and enter a 10-digit mobile number.`;
      const rrn = normalizeRrn(member.rrn);
      if (rrns.has(rrn)) return `${rule.title}: the same RRN cannot appear twice as registrant or teammate; each participant must have a different RRN. ${REGISTRATION_HELP}`;
      rrns.add(rrn);
    }
  }
  return null;
}
