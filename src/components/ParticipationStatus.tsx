import { useEffect, useState } from 'react';
import { fetchParticipation, type ParticipationEvent } from '../lib/supabase';
import { normalizeRrn } from '../../shared/registrationRules';

/** Only the entered RRN's event associations are exposed by this read-only API. */
export function ParticipationStatus({ rrn }: { rrn: string }) {
  const key = normalizeRrn(rrn);
  const [result, setResult] = useState<{ key: string; events?: ParticipationEvent[]; error?: string }>({ key: '' });
  useEffect(() => {
    if (!key) return;
    let active = true;
    const timer = setTimeout(() => {
      Promise.resolve().then(() => fetchParticipation([key])).then(data => { if (active) setResult({ key, events: data[key] || [] }); })
        .catch(() => { if (active) setResult({ key, error: 'Unable to load existing events right now. The server will check this RRN before confirming registration.' }); });
    }, 600);
    return () => { active = false; clearTimeout(timer); };
  }, [key]);
  if (!key) return null;
  if (result.key !== key) return <p className="reg-span-2 text-sm" role="status">Checking existing events for RRN {key}…</p>;
  if (result.error) return <p className="reg-span-2 text-sm" role="status">{result.error}</p>;
  const events = result.events || [];
  const maximum = events.length >= 2;
  return <section className="reg-span-2 rounded-lg border border-current/20 p-3 text-sm space-y-2" aria-label={`Existing events for RRN ${key}`}>
    <p className="font-semibold">Existing participation · RRN {key}</p>
    {!events.length ? <p>No existing events found.</p> : <ul className="list-disc pl-5">{events.map(event => <li key={event.id}>{event.title} · {event.category === 'technical' ? 'Technical' : event.category === 'non-technical' ? 'Non-Technical' : 'Category needs review'} · {event.roles.join(', ')}{event.uncertain ? ' · Historical assignment needs admin review' : ''}</li>)}</ul>}
    <p>{maximum ? 'Maximum event limit reached. You cannot join another event.' : events.length ? 'You may join one event in the other category. You cannot join this event again through another team.' : 'Maximum two events: one Technical and one Non-Technical, including teammate and substitute entries.'}</p>
    {maximum && <p>For help, contact Vijay Hari at <a className="underline" href="tel:+917338985189">+91 733 898 5189</a>.</p>}
  </section>;
}
