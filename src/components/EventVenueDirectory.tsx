import { EVENTS } from '../data/eventsData';
import { EVENT_VENUES } from '../../shared/eventVenues';

export function EventVenueDirectory() {
  return <section className="event-venue-directory" aria-labelledby="event-venues-title">
    <h2 id="event-venues-title" className="font-display text-2xl font-bold mb-3">Event venues</h2>
    <p className="text-ink-muted mb-5">B.S. Abdur Rahman Crescent Institute of Science &amp; Technology, Vandalur, Chennai.</p>
    <div className="grid md:grid-cols-2 gap-x-10">
      {(['technical', 'non-technical'] as const).map(category => <div key={category}>
        <h3 className="font-space font-bold mb-2 capitalize">{category === 'technical' ? 'Technical events' : 'Non-technical events'}</h3>
        <dl>{EVENTS.filter(event => event.category === category).map(event => <div key={event.id} className="grid grid-cols-2 gap-3 py-3 border-b border-current/15">
          <dt className="font-semibold">{event.title}</dt><dd className="text-ink-muted">{EVENT_VENUES[event.id]}</dd>
        </div>)}</dl>
      </div>)}
    </div>
  </section>;
}
