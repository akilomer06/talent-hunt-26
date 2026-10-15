import { createClient } from '@supabase/supabase-js';
import { EVENTS as DEFAULT_EVENTS, type EventItem } from '../data/eventsData';

export const SUPABASE_URL = 'https://spowdisyvuvaicasewdf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_S6cUFCL68pSG_DlzQgoyZA_vubA2Y_E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface TeamMember {
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

const REGISTRATIONS_CACHE_KEY = 'th26_registrations_cache';
const EVENTS_CACHE_KEY = 'th26_events_cache';
const SETTINGS_CACHE_KEY = 'th26_settings_cache';

// Helper for local storage backup
function getCachedRegistrations(): RegistrationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTRATIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCachedRegistrations(list: RegistrationRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REGISTRATIONS_CACHE_KEY, JSON.stringify(list));
  } catch {}
}

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

/**
 * Submit student registration to Supabase + local cache backup
 */
export async function submitRegistration(record: Omit<RegistrationRecord, 'id' | 'created_at'>): Promise<{ success: boolean; data?: any; error?: string }> {
  const timestamp = new Date().toISOString();
  const entry: RegistrationRecord = {
    ...record,
    created_at: timestamp,
  };

  // 1. Immediately cache locally
  const current = getCachedRegistrations();
  setCachedRegistrations([entry, ...current.filter((r) => r.reg_id !== entry.reg_id)]);

  // 2. Insert into Supabase
  try {
    const { data, error } = await supabase.from('registrations').insert([
      {
        reg_id: entry.reg_id,
        name: entry.name,
        rrn: entry.rrn,
        mobile: entry.mobile,
        programme: entry.programme,
        year: entry.year,
        department: entry.department,
        section: entry.section || '',
        selected_events: entry.selected_events,
        team_members: entry.team_members,
        created_at: timestamp,
      },
    ]).select();

    if (error) {
      console.warn('Supabase insert note (cached locally):', error.message);
      return { success: true, data: entry };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('Network / Supabase write error, saved to local cache:', err);
    return { success: true, data: entry };
  }
}

/**
 * Fetch all registrations from Supabase (falling back to cache)
 */
export async function fetchRegistrations(): Promise<RegistrationRecord[]> {
  const localList = getCachedRegistrations();

  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      // Merge Supabase with local (deduplicating by reg_id)
      const map = new Map<string, RegistrationRecord>();
      for (const item of data) {
        map.set(item.reg_id, item);
      }
      for (const item of localList) {
        if (!map.has(item.reg_id)) {
          map.set(item.reg_id, item);
        }
      }
      const combined = Array.from(map.values());
      setCachedRegistrations(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Failed to fetch from Supabase, returning local cache:', err);
  }

  return localList;
}

/**
 * Delete a registration from Supabase and cache
 */
export async function deleteRegistration(regId: string): Promise<boolean> {
  const current = getCachedRegistrations();
  setCachedRegistrations(current.filter((r) => r.reg_id !== regId));

  try {
    await supabase.from('registrations').delete().eq('reg_id', regId);
  } catch {}

  return true;
}

/**
 * Fetch dynamic site content overrides (events, venue, settings)
 */
export async function fetchLiveSiteContent(): Promise<{ events: EventItem[]; settings: SiteSettings }> {
  let events = getCachedEvents();
  let settings = getCachedSettings();

  try {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row.key === 'events' && Array.isArray(row.value) && row.value.length > 0) {
          events = row.value;
          setCachedEvents(events);
        }
        if (row.key === 'settings' && row.value) {
          settings = { ...DEFAULT_SITE_SETTINGS, ...row.value };
          setCachedSettings(settings);
        }
      }
    }
  } catch (err) {
    console.warn('Using cached site content:', err);
  }

  return { events, settings };
}

/**
 * Save updated event items or site settings to Supabase
 */
export async function saveLiveEvents(events: EventItem[]): Promise<boolean> {
  setCachedEvents(events);

  try {
    const { error } = await supabase.from('site_content').upsert(
      { key: 'events', value: events, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) console.warn('Supabase site_content note:', error.message);
  } catch (err) {
    console.warn('Supabase write error, cached locally:', err);
  }

  return true;
}

export async function saveLiveSettings(settings: SiteSettings): Promise<boolean> {
  setCachedSettings(settings);

  try {
    const { error } = await supabase.from('site_content').upsert(
      { key: 'settings', value: settings, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) console.warn('Supabase site_content note:', error.message);
  } catch (err) {
    console.warn('Supabase write error, cached locally:', err);
  }

  return true;
}
