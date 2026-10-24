import { describe, expect, it } from 'vitest';
import { toggleEventSelection, TEAM_RULES, validateEventTeams, closedRegistrationError } from '@/lib/registration';
import { EVENTS } from '@/data/eventsData';

const cat = (id: string) => (id.startsWith('t') ? ('technical' as const) : ('non-technical' as const));

describe('final registration closure', () => {
  it('locks every event for new entries while retaining existing admin selections', () => {
    for (const id of Object.keys(TEAM_RULES)) {
      expect(toggleEventSelection([], id, () => TEAM_RULES[id]!.category).blocked).toBe(true);
      expect(closedRegistrationError([id])).toContain('Online registration is closed for all events');
      expect(closedRegistrationError([id], [id])).toBeNull();
    }
  });
  it('allows deselection without allowing additional registrations', () => {
    expect(toggleEventSelection(['code-break', 'fifa'], 'code-break', cat).next).toEqual(['fifa']);
    expect(toggleEventSelection(['code-break'], 'shutter-verse', cat).blocked).toBe(true);
  });
});

const member = (event_id: string, rrn: string) => ({ event_id, name: 'Teammate', rrn, mobile: '0000000000', programme: 'B.Tech', year: 'II', department: 'IoT' });
describe('event-specific team requirements', () => {
  it('covers every event with the correct category', () => {
    for (const event of EVENTS) expect(TEAM_RULES[event.id]?.category).toBe(event.category);
  });
  it('allows smaller Code Break teams and keeps the four-person maximum', () => {
    expect(validateEventTeams(['code-break'], [], '1')).toBeNull();
    expect(validateEventTeams(['code-break'], [member('code-break', '2')], '1')).toBeNull();
    expect(validateEventTeams(['code-break'], ['2', '3', '4'].map(rrn => member('code-break', rrn)), '1')).toBeNull();
    expect(validateEventTeams(['code-break'], ['2', '3', '4', '5'].map(rrn => member('code-break', rrn)), '1')).toContain('up to 4');
  });
  it('allows solo entries where permitted and rejects teammates for individual events', () => {
    expect(validateEventTeams(['code-canvas', 'fifa'], [], '1')).toBeNull();
    expect(validateEventTeams(['fifa'], [member('fifa', '2')], '1')).toContain('up to 1');
  });
  it('accepts smaller BGMI teams with a maximum of five including the optional substitute', () => {
    for (const count of [0, 1, 3, 4]) expect(validateEventTeams(['bgmi'], Array.from({length: count}, (_, i) => member('bgmi', String(i + 2))), '1')).toBeNull();
    expect(validateEventTeams(['bgmi'], Array.from({length: 5}, (_, i) => member('bgmi', String(i + 2))), '1')).toContain('up to 5');
  });
  it('keeps team rosters separate for the two selected events', () => {
    expect(validateEventTeams(['prompt-pop', 'clue-code'], [member('prompt-pop', '2'), member('clue-code', '2'), member('clue-code', '3')], '1')).toBeNull();
    expect(validateEventTeams(['prompt-pop', 'clue-code'], [member('prompt-pop', '2')], '1')).toBeNull();
  });
  it('allows Trashion entries up to five total participants', () => {
    for (const count of [0, 1, 4]) {
      expect(validateEventTeams(['trashion'], Array.from({ length: count }, (_, i) => member('trashion', String(i + 2))), '1')).toBeNull();
    }
    expect(validateEventTeams(['trashion'], Array.from({ length: 5 }, (_, i) => member('trashion', String(i + 2))), '1')).toContain('up to 5');
  });
  it('limits Neural Nexus to three total participants including the registrant', () => {
    expect(validateEventTeams(['neural-nexus'], [member('neural-nexus', '2'), member('neural-nexus', '3')], '1')).toBeNull();
    expect(validateEventTeams(['neural-nexus'], ['2', '3', '4'].map(rrn => member('neural-nexus', rrn)), '1')).toContain('up to 3');
  });
  it('rejects invalid categories, repeated RRNs and unrelated teammates', () => {
    expect(validateEventTeams(['tech-talks', 'game-craft'], [], '1')).toContain('one technical');
    expect(validateEventTeams(['prompt-pop'], [member('prompt-pop', '1')], '1')).toContain('different RRN');
    expect(validateEventTeams(['prompt-pop'], [member('prompt-pop', 'a b c')], 'ABC')).toContain('Vijay Hari');
    expect(validateEventTeams(['neural-nexus'], [member('neural-nexus', 'a b c'), member('neural-nexus', 'ABC')], '001')).toContain('cannot appear twice');
    expect(validateEventTeams(['fifa'], [member('code-canvas', '2')], '1')).toContain('selected event');
  });
  it('allows one participant for every event without relaxing any event maximum', () => {
    for (const [id, rule] of Object.entries(TEAM_RULES)) {
      expect(validateEventTeams([id], [], '001')).toBeNull();
      expect(validateEventTeams([id], Array.from({ length: rule.max }, (_, i) => member(id, String(i + 2))), '001')).toContain(`up to ${rule.max}`);
    }
  });
});
