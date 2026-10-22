import React from 'react';
import {
  Code2,
  Layout,
  Brain,
  Cpu,
  Gamepad2,
  Mic2,
  ShieldAlert,
  Sparkles,
  Camera,
  Search,
  Shirt,
  PlayCircle,
  Crosshair,
  Trophy,
  Flame,
  Gavel,
  type LucideIcon,
} from 'lucide-react';
import { EventItem } from '../data/eventsData';
import { isEventRegistrationClosed } from '../lib/registration';

const ICON_MAP: Record<string, LucideIcon> = {
  Code2,
  Layout,
  Brain,
  Cpu,
  Gamepad2,
  Mic2,
  ShieldAlert,
  Sparkles,
  Camera,
  Search,
  Shirt,
  PlayCircle,
  Crosshair,
  Trophy,
  Flame,
  Gavel,
};

export function EventCard({
  event,
  onOpenDetails,
}: {
  event: EventItem;
  onOpenDetails: (id: string) => void;
}) {
  const Icon = ICON_MAP[event.iconName] || Sparkles;
  const isNonTech = event.category === 'non-technical';
  const orderNum = parseInt(event.number, 10) || 1;
  const artIndex = (orderNum - 1) % 4;

  const handlePointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    e.currentTarget.style.setProperty('--tilt-x', `${(0.5 - y) * 8}deg`);
    e.currentTarget.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`);
    e.currentTarget.style.setProperty('--pointer-x', `${x * 100}%`);
    e.currentTarget.style.setProperty('--pointer-y', `${y * 100}%`);
  };

  const resetTilt = (
    e: React.PointerEvent<HTMLAnchorElement> | React.FocusEvent<HTMLAnchorElement>
  ) => {
    e.currentTarget.style.setProperty('--tilt-x', '0deg');
    e.currentTarget.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <article
      className={`event-card ${isNonTech ? 'card-orange' : ''}`}
      style={{ '--card-order': (orderNum - 1) % 3 } as React.CSSProperties}
    >
      <a
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetails(event.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetails(event.id);
          }
        }}
        aria-label={`Explore ${event.title}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onBlur={resetTilt}
      >
        <div className="card-topline">
          <span className="card-category">
            <span className="card-category-dot" />
            {event.category === 'technical' ? 'Technical' : 'Non-Technical'}
          </span>
          <span className="card-edition">
            <span className="card-edition-num">#{event.number}</span>
          </span>
        </div>

        <div
          className={`event-art art-${artIndex} ${isNonTech ? 'art-orange' : ''}`}
          aria-hidden="true"
        >
          <span className="art-grid" />
          <span className="art-light" />
          <span className="art-sculpture" />
          <span className="art-orbit" />
          <span className="art-orbit art-orbit-second" />
          <span className="art-type">{event.title}</span>
          <span className="art-number">{event.number}</span>
          <div className="event-card-center-icon">
            <Icon strokeWidth={2} />
          </div>
          <span className="art-caption">
            <span className="art-crosshair">+</span> TH / 26{' '}
            <span className="art-barcode" />
          </span>
        </div>

        <span className="card-power" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>

        <div className="card-copy">
          <div className="card-badges-row">
            <span className="card-chip">{isEventRegistrationClosed(event.id) ? 'Registration closed' : '2026 EDITION'}</span>
            <span className="card-chip">
              {event.category === 'technical' ? 'TECH ARENA' : 'OPEN ARENA'}
            </span>
            <span className="card-chip card-venue-chip" title="Event Venue">
              📍 {event.venue || 'VENUE TBA'}
            </span>
          </div>
          <h3>{event.title}</h3>
          <p>{event.shortDesc}</p>
          <span className="card-action">
            <span className="card-action-label">
              <span>Explore Event</span>
              <span className="card-action-sub">
                {event.teamSize ? `Team: ${event.teamSize}` : 'Select your challenge'}
              </span>
            </span>
            <span className="card-arrow">
              <span aria-hidden="true">↗</span>
            </span>
          </span>
        </div>
      </a>
    </article>
  );
}
