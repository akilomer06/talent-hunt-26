import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { useLiveContent } from '../hooks/useLiveContent';
import { EventCard } from './EventCard';
import { Button } from './ui/button';
import { EventTicker } from './EventTicker';
type CategoryFilter = 'all' | 'technical' | 'non-technical';
export function EventDirectory({ onOpenEventDetails, track }: { onOpenEventDetails: (id: string) => void; track?: 'technical' | 'non-technical' }) {
  const { events: liveEvents } = useLiveContent();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredEvents = useMemo(() => liveEvents.filter(event => {
    const matchesCategory = (track ?? selectedCategory) === 'all' || event.category === (track ?? selectedCategory);
    const query = searchQuery.toLowerCase().trim();
    return matchesCategory && (!query || event.title.toLowerCase().includes(query) || event.shortDesc.toLowerCase().includes(query) || event.tags.some(tag => tag.toLowerCase().includes(query)));
  }), [selectedCategory, searchQuery, track, liveEvents]);
  const categories: { id: CategoryFilter; label: string }[] = [{ id: 'all', label: 'All events' }, { id: 'technical', label: 'Technical' }, { id: 'non-technical', label: 'Non-technical' }];
  return <>
    {!track && <EventTicker />}
    <section id="events" className={`arena-section ${track ? 'category-page' : ''}`}>
    <div className="section-inner">
      <div className="arena-heading" data-reveal><div><p className="section-kicker">THE LINEUP / 2026</p>{track ? <h1>{track === 'technical' ? 'Hack the limits.' : 'Steal the spotlight.'}</h1> : <h2>Choose your <span>arena.</span></h2>}</div><p>Eight technical. Eight non-technical.<br />Sixteen ways to make your mark. <ArrowUpRight /></p></div>
      <div className="arena-controls">
        {!track && <div className="arena-tabs" aria-label="Event Categories">
          {categories.map(category => <Button key={category.id} variant="festivalGhost" onClick={() => setSelectedCategory(category.id)} aria-pressed={selectedCategory === category.id} className={`arena-tab ${selectedCategory === category.id ? 'active' : ''}`}>{category.label}<span>{category.id === 'all' ? '16' : '08'}</span></Button>)}
        </div>}
        <div className="arena-search"><Search aria-hidden="true" /><input aria-label="Search events" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search your arena" />{searchQuery && <Button variant="festivalGhost" size="icon" onClick={() => setSearchQuery('')} aria-label="Clear search query"><X /></Button>}</div>
      </div>
      <p className="arena-count" aria-live="polite">{filteredEvents.length} / {track ? 8 : 16} events</p>
      {filteredEvents.length ? <div>{(['technical','non-technical'] as const).map(category => {
        const events = filteredEvents.filter(event => event.category === category);
        return events.length > 0 ? <section id={`${category}-events`} key={category} className="arena-category-group"><div className="category-heading"><div><p className="section-kicker">{category === 'technical' ? 'TECHNICAL EVENTS' : 'NON-TECHNICAL EVENTS'}</p><h3>{category === 'technical' ? 'Hack the limits.' : 'Steal the spotlight.'}</h3></div>{!track && <Link to={category === 'technical' ? '/events/technical' : '/events/non-technical'}>View all events <ArrowUpRight/></Link>}</div><div className="arena-grid">{events.map(event => <EventCard key={event.id} event={event} onOpenDetails={onOpenEventDetails} />)}</div></section> : null;
      })}</div> : <div className="arena-empty"><Search /><h3>No matching events</h3><Button variant="festivalOutline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>Reset filters</Button></div>}
    </div>
  </section>
  </>;
}
