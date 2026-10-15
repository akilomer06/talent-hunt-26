import { EVENTS as DEFAULT_EVENTS, type EventItem } from '../data/eventsData';
import { apiRequest as api } from './api';

const TOKEN_KEY = 'th26_admin_token';

export async function loginAdmin(passcode: string): Promise<void> {
  const { token } = await api<{ token: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ passcode }) });
  if (typeof token !== 'string' || !token) throw new Error('The backend returned an invalid sign-in response. Please try again.');
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function logoutAdmin(): void { sessionStorage.removeItem(TOKEN_KEY); }
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

export async function fetchRegistrations(): Promise<RegistrationRecord[]> {
  return api('/api/registrations');
}

export async function deleteRegistration(regId: string): Promise<boolean> {
  await api('/api/registrations/' + encodeURIComponent(regId), { method: 'DELETE' });
  return true;
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
