import { EVENTS as DEFAULT_EVENTS, type EventItem } from '../data/eventsData';
import { apiRequest as api } from './api';

const TOKEN_KEY = 'th26_admin_token';
export type AdminPortal = 'admin' | 'registration';
const tokenKey = (portal: AdminPortal) => portal === 'registration' ? 'th26_registration_token' : TOKEN_KEY;
function portalApi<T>(path: string, portal: AdminPortal, options: RequestInit = {}): Promise<T> {
  const token = typeof window === 'undefined' ? '' : sessionStorage.getItem(tokenKey(portal)) || '';
  return api(path, { ...options, headers: { ...options.headers, Authorization: 'Bearer ' + token } });
}

export async function loginAdmin(passcode: string, portal: AdminPortal = 'admin'): Promise<void> {
  const endpoint = portal === 'registration' ? '/api/adminregistration/login' : '/api/admin/login';
  const { token } = await api<{ token: string }>(endpoint, { method: 'POST', body: JSON.stringify({ passcode, portal }) });
  if (typeof token !== 'string' || !token) throw new Error('The backend returned an invalid sign-in response. Please try again.');
  sessionStorage.setItem(tokenKey(portal), token);
}
export function logoutAdmin(portal: AdminPortal = 'admin'): void { sessionStorage.removeItem(tokenKey(portal)); }
export function checkAdminSession(portal: AdminPortal): Promise<{ role: AdminPortal }> { return portalApi('/api/admin/session', portal); }
export interface RegistrationAccess { enabled: boolean; configured: boolean; }
export function getRegistrationAccess(): Promise<RegistrationAccess> { return portalApi('/api/admin/access', 'admin'); }
export function setRegistrationAccess(enabled: boolean, passcode?: string): Promise<RegistrationAccess> {
  return portalApi('/api/admin/access', 'admin', { method: 'PUT', body: JSON.stringify({ enabled, ...(passcode ? { passcode } : {}) }) });
}
export async function checkBackendHealth(): Promise<boolean> {
  try { await api('/api/health'); return true; } catch { return false; }
}

export interface TeamMember {
  event_id?: string;
  name: string;
  rrn: string;
  mobile: string;
  programme: string;
  year: string;
  department: string;
  section?: string;
}

export interface RegistrationRecord {
  id?: string;
  reg_id: string;
  name: string;
  rrn: string;
  mobile: string;
  programme: string;
  year: string;
  department: string;
  section?: string;
  selected_events: string[];
  team_members: TeamMember[];
  created_at?: string;
}

export interface SiteSettings {
  venueName: string;
  venueSubtitle: string;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  announcementText: string;
  googleFormUrl: string;
  brochureUrl?: string;
  qrCodeUrl?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  venueName: 'Auditorium',
  venueSubtitle: 'B.S. Abdur Rahman Crescent Institute',
  eventDate: '26 October 2026',
  eventDay: 'Monday',
  eventTime: '9:00 AM IST',
  announcementText: 'Open exclusively to CSE & allied SCIMS students. Bring your Crescent Student ID.',
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSeE1heCwcf6SR22IGbva0CaDPljSZsOaNKwm1MakO6c6roA-A/viewform',
};

const EVENTS_CACHE_KEY = 'th26_events_cache';
const SETTINGS_CACHE_KEY = 'th26_settings_cache';

export function getCachedEvents(): EventItem[] {
  if (typeof window === 'undefined') return DEFAULT_EVENTS;
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_EVENTS;
}

export function setCachedEvents(events: EventItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('th26_content_updated'));
  } catch {}
}

export function getCachedSettings(): SiteSettings {
  if (typeof window === 'undefined') return DEFAULT_SITE_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SITE_SETTINGS;
}

export function setCachedSettings(settings: SiteSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('th26_content_updated'));
  } catch {}
}

/** Submit registrations only when the backend confirms database persistence. */
export async function submitRegistration(record: Omit<RegistrationRecord, 'id' | 'created_at'>): Promise<{ success: boolean; data: RegistrationRecord }> {
  return api('/api/registrations', { method: 'POST', body: JSON.stringify(record) });
}

export interface ParticipationEvent { id: string; title: string; category: string; roles: string[]; uncertain: boolean }
export async function fetchParticipation(rrns: string[]): Promise<Record<string, ParticipationEvent[]>> {
  const result = await api<{ participation: Record<string, ParticipationEvent[]> }>('/api/participation', { method: 'POST', body: JSON.stringify({ rrns }) });
  return result.participation;
}

export async function fetchRegistrations(portal: AdminPortal = 'admin'): Promise<RegistrationRecord[]> {
  return portalApi('/api/registrations', portal);
}

export async function deleteRegistration(regId: string, expected?: RegistrationRecord): Promise<boolean> {
  const result = await portalApi<{ success: boolean; reg_id: string }>('/api/registrations/' + encodeURIComponent(regId), 'admin', { method: 'DELETE', ...(expected ? { body: JSON.stringify({ expected }) } : {}) });
  if (result.success !== true || result.reg_id !== regId) throw new Error('The database did not confirm this deletion. Refresh the roster before retrying.');
  return true;
}

export async function updateRegistration(record: RegistrationRecord, expected: RegistrationRecord): Promise<RegistrationRecord> {
  const result = await portalApi<{ data: RegistrationRecord }>('/api/registrations/' + encodeURIComponent(record.reg_id), 'admin', { method: 'PUT', body: JSON.stringify({ record, expected }) });
  return result.data;
}

export async function createAdminRegistration(record: RegistrationRecord, requestId: string): Promise<RegistrationRecord> {
  const result = await portalApi<{ data: RegistrationRecord }>('/api/admin/registrations', 'admin', { method: 'POST', body: JSON.stringify({ ...record, request_id: requestId }) });
  return result.data;
}

export async function fetchLiveSiteContent(): Promise<{ events: EventItem[]; settings: SiteSettings }> {
  let events = getCachedEvents();
  let settings = getCachedSettings();
  try {
    const rows = await api<Array<{ key: string; value: unknown }>>('/api/content');
    for (const row of rows) {
      if (row.key === 'events' && Array.isArray(row.value) && row.value.length > 0) {
        events = row.value as EventItem[];
        setCachedEvents(events);
      }
      if (row.key === 'settings' && row.value && typeof row.value === 'object') {
        settings = { ...DEFAULT_SITE_SETTINGS, ...row.value };
        setCachedSettings(settings);
      }
    }
  } catch (error) { console.warn('Using cached site content:', error); }
  return { events, settings };
}

export async function saveLiveEvents(events: EventItem[]): Promise<boolean> {
  await api('/api/content/events', { method: 'PUT', body: JSON.stringify(events) });
  setCachedEvents(events);
  return true;
}

export async function saveLiveSettings(settings: SiteSettings): Promise<boolean> {
  await api('/api/content/settings', { method: 'PUT', body: JSON.stringify(settings) });
  setCachedSettings(settings);
  return true;
}
