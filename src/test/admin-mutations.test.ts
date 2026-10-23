import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiRequest } from '../lib/api';
import { deleteRegistration, type RegistrationRecord } from '../lib/supabase';

vi.mock('../lib/api', () => ({ apiRequest: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); sessionStorage.setItem('th26_admin_token', 'test-main-session'); });
afterEach(() => sessionStorage.clear());
const source: RegistrationRecord = { reg_id: 'REVIEW', name: 'Example', rrn: '001', mobile: '9000000000', programme: 'B.Tech', year: 'II', department: 'CSE', selected_events: ['code-break'], team_members: [] };

it('deletes with the main-admin token and reviewed source snapshot, requiring a matching confirmation', async () => {
  vi.mocked(apiRequest).mockResolvedValue({ success: true, reg_id: source.reg_id });
  await expect(deleteRegistration(source.reg_id, source)).resolves.toBe(true);
  expect(apiRequest).toHaveBeenCalledWith('/api/registrations/REVIEW', { method: 'DELETE', headers: { Authorization: 'Bearer test-main-session' }, body: JSON.stringify({ expected: source }) });
  vi.mocked(apiRequest).mockResolvedValue({ success: true, reg_id: 'DIFFERENT-PASS' });
  await expect(deleteRegistration(source.reg_id, source)).rejects.toThrow('did not confirm');
  vi.mocked(apiRequest).mockRejectedValue(new Error('Database unavailable'));
  await expect(deleteRegistration(source.reg_id, source)).rejects.toThrow('Database unavailable');
});
