export const MAX_PER_CATEGORY = 1;
export { TEAM_RULES, validateEventTeams } from '../../shared/registrationRules';

export type EventCategory = 'technical' | 'non-technical';

/** Toggle an event while allowing at most one pick in each category. */
export function toggleEventSelection(
  selected: string[],
  eventId: string,
  categoryOf: (id: string) => EventCategory | undefined,
): { next: string[]; blocked: boolean } {
  if (selected.includes(eventId)) return { next: selected.filter((id) => id !== eventId), blocked: false };
  const cat = categoryOf(eventId);
  const count = selected.filter((id) => categoryOf(id) === cat).length;
  if (count >= MAX_PER_CATEGORY) return { next: selected, blocked: true };
  return { next: [...selected, eventId], blocked: false };
}

export const PROGRAMMES = ['B.Tech', 'M.Tech'] as const;
export const YEARS = ['II', 'III', 'IV'] as const;
export const DEPARTMENTS = ['CSE', 'AI&DS', 'IoT', 'Cybersecurity'] as const;

export const SECTIONS_MAP: Record<string, string[]> = {
  CSE: ['A', 'B', 'C', 'D'],
  'AI&DS': ['A', 'B', 'C'],
};

/** Returns true if the department has sections (CSE and AI&DS). CS/Cybersecurity and IoT have no sections. */
export function hasSection(department: string): boolean {
  return department === 'CSE' || department === 'AI&DS';
}

export function getSectionsForDepartment(department: string): string[] {
  return SECTIONS_MAP[department] || [];
}
