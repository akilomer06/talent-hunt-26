import { useState, useEffect } from 'react';
import { type EventItem } from '../data/eventsData';
import {
  getCachedEvents,
  getCachedSettings,
  fetchLiveSiteContent,
  type SiteSettings,
} from '../lib/supabase';

export function useLiveContent() {
  const [events, setEvents] = useState<EventItem[]>(getCachedEvents);
  const [settings, setSettings] = useState<SiteSettings>(getCachedSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial sync with Supabase
    fetchLiveSiteContent().then(({ events: remoteEvents, settings: remoteSettings }) => {
      setEvents(remoteEvents);
      setSettings(remoteSettings);
      setLoading(false);
    });

    // 2. Listen for local CMS updates
    const handleUpdate = () => {
      setEvents(getCachedEvents());
      setSettings(getCachedSettings());
    };

    window.addEventListener('th26_content_updated', handleUpdate);
    return () => window.removeEventListener('th26_content_updated', handleUpdate);
  }, []);

  return { events, settings, loading };
}
