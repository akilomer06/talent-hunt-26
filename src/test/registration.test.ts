import { describe, expect, it } from 'vitest';
import { toggleEventSelection, TEAM_RULES, validateEventTeams } from '@/lib/registration';
import { EVENTS } from '@/data/eventsData';

const cat = (id: string) => (id.startsWith('t') ? ('technical' as const) : ('non-technical' as const));

describe('event selection limits', () => {
  it('blocks a second technical event', () => {
    const r = toggleEventSelection(['t1'], 't2', cat);
    expect(r.blocked).toBe(true);
    expect(r.next).toEqual(['t1']);
  });
  it('blocks a second non-technical event', () => {
    expect(toggleEventSelection(['n1', 't1'], 'n2', cat).blocked).toBe(true);
  });
  it('allows one of each category and deselection', () => {
    expect(toggleEventSelection(['t1'], 'n1', cat).next).toEqual(['t1', 'n1']);
    expect(toggleEventSelection(['t1', 'n1'], 't1', cat).next).toEqual(['n1']);
  });
});

const member = (event_id: string, rrn: string) => ({ event_id, name: 'Teammate', rrn, mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'IoT' });
describe('event-specific team requirements', () => {
  it('covers every event with the correct category', () => {
    for (const event of EVENTS) expect(TEAM_RULES[event.id]?.category).toBe(event.category);
  });
  it('requires exactly three teammates for Code Break', () => {
    expect(validateEventTeams(['code-break'], [member('code-break', '2')], '1')).toContain('exactly 4');
    expect(validateEventTeams(['code-break'], ['2', '3', '4'].map(rrn => member('code-break', rrn)), '1')).toBeNull();
  });
  it('allows solo entries where permitted and rejects teammates for individual events', () => {
    expect(validateEventTeams(['code-canvas', 'fifa'], [], '1')).toBeNull();
    expect(validateEventTeams(['fifa'], [member('fifa', '2')], '1')).toContain('exactly 1');
  });
  it('enforces BGMI four main players and one optional substitute', () => {
    for (const count of [3, 4]) expect(validateEventTeams(['bgmi'], Array.from({length: count}, (_, i) => member('bgmi', String(i + 2))), '1')).toBeNull();
    expect(validateEventTeams(['bgmi'], [member('bgmi', '2')], '1')).toContain('4–5');
    expect(validateEventTeams(['bgmi'], Array.from({length: 5}, (_, i) => member('bgmi', String(i + 2))), '1')).toContain('4–5');
  });
  it('keeps team rosters separate for the two selected events', () => {
    expect(validateEventTeams(['prompt-pop', 'clue-code'], [member('prompt-pop', '2'), member('clue-code', '2'), member('clue-code', '3')], '1')).toBeNull();
    expect(validateEventTeams(['prompt-pop', 'clue-code'], [member('prompt-pop', '2')], '1')).toContain('Clue Code');
  });
  it('allows Trashion entries up to five total participants', () => {
    for (const count of [0, 1, 4]) {
      expect(validateEventTeams(['trashion'], Array.from({ length: count }, (_, i) => member('trashion', String(i + 2))), '1')).toBeNull();
    }
    expect(validateEventTeams(['trashion'], Array.from({ length: 5 }, (_, i) => member('trashion', String(i + 2))), '1')).toContain('1–5');
  });
  it('rejects invalid categories, repeated RRNs and unrelated teammates', () => {
    expect(validateEventTeams(['tech-talks', 'game-craft'], [], '1')).toContain('one technical');
    expect(validateEventTeams(['prompt-pop'], [member('prompt-pop', '1')], '1')).toContain('different RRN');
    expect(validateEventTeams(['fifa'], [member('code-canvas', '2')], '1')).toContain('selected event');
  });
});
