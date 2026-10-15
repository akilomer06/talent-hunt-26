import { Asterisk } from 'lucide-react';
import { useLiveContent } from '../hooks/useLiveContent';

export function EventTicker() {
  const { events } = useLiveContent();
  return <div className="festival-ticker" aria-hidden="true"><div>{[0, 1].map(copy => <div className="ticker-copy" key={copy}>{events.map(event => <span key={event.id}>{event.title}<Asterisk /></span>)}</div>)}</div></div>;
}
