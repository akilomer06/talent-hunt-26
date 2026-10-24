import { applyEventVenues } from './eventVenues.ts';

export const TRASHION_RETRO_CONTENT = {
  shortDesc: 'A retro-themed fashion show for teams of up to five. Dress up, share your concept and take the stage.',
  overview: 'Trashion is now a retro-themed fashion show. Teams of up to five wear retro-inspired clothes and explain the idea behind their look. Choose any retro concept, such as a movie, character or era. Outfits do not need to be made from waste or recycled materials.',
  teamSize: 'Up to 5 members per team',
  duration: '1:00 PM – 2:30 PM IST',
  materials: 'Bring your own retro-themed clothes and accessories. Waste or recycled materials are not required.',
  tags: ['Retro Fashion', 'Costume Concept', 'Team Showcase', 'Ramp Walk'],
  specialNotes: [
    'Theme: Retro.',
    'Separate boys’ teams and girls’ teams are allowed. Mixed-gender teams are not permitted.',
  ],
  rules: [
    'Teams can have a maximum of 5 participants. All team members are encouraged to dress to match the chosen retro concept.',
    'Wear retro-themed clothes. There is no need to make outfits from waste or recycled materials.',
    'Choose your own retro concept: a movie, character, era or any idea you like. Your concept is part of the judging.',
    'You may get ready at home or on campus, whichever is convenient. Bring your own clothes and accessories.',
    'The event starts at 1:00 PM IST on 26 October 2026 in the Auditorium. Please be ready on time.',
    'Be ready to answer questions about your outfits and concept. Your explanation, confidence and presentation carry marks.',
    'The closing ramp walk takes place before prize distribution. The segment lasts 5 minutes, with 1 minute per team to walk once and exit.',
    'Friends who want to join only the valedictory ramp walk can contact the coordinators. They do not need to compete in the main fashion event.',
    'Outfits must be appropriate for a college event. Unsafe accessories and offensive content are not allowed.',
    'The judges’ decision is final.',
  ],
  judgingCriteria: [
    { criterion: 'Retro theme and concept' },
    { criterion: 'Costume creativity and styling' },
    { criterion: 'Explanation of outfits and concept' },
    { criterion: 'Confidence and presentation' },
  ],
};

// Keep the revised event brief consistent with older CMS content and browser caches.
export function applyEventContent<T extends { id: string; venue?: string }>(events: T[]): T[] {
  return applyEventVenues(events).map(event => event.id === 'trashion' ? { ...event, ...TRASHION_RETRO_CONTENT } : event);
}
