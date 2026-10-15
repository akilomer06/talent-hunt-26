import { describe, expect, it } from 'vitest';
import { toggleEventSelection } from '@/lib/registration';

const cat = (id: string) => (id.startsWith('t') ? ('technical' as const) : ('non-technical' as const));

describe('event selection limits', () => {
  it('blocks a third technical event', () => {
    const r = toggleEventSelection(['t1', 't2'], 't3', cat);
    expect(r.blocked).toBe(true);
    expect(r.next).toEqual(['t1', 't2']);
  });
  it('blocks a third non-technical event', () => {
    expect(toggleEventSelection(['n1', 'n2', 't1'], 'n3', cat).blocked).toBe(true);
  });
  it('allows two of each category (four total)', () => {
    expect(toggleEventSelection(['t1', 't2', 'n1'], 'n2', cat).next).toEqual(['t1', 't2', 'n1', 'n2']);
  });
});
