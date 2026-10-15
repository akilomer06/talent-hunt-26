import React, { useEffect } from 'react';
import { X, Users, Clock, MapPin, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import { EventItem } from '../data/eventsData';

interface EventModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRegister: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onRegister }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (event) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [event, onClose]);

  if (!event) return null;

  const isTech = event.category === 'technical';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div
        className="relative w-full max-w-2xl bg-paper-soft brutal-border-thick brutal-shadow-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-ink mb-6">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono font-extrabold text-sm sm:text-base px-2.5 py-1 brutal-border text-white ${
                isTech ? 'bg-electric-blue' : 'bg-vivid-orange'
              }`}
            >
              EVENT #{event.number}
            </span>
            <span className="font-space text-xs font-bold uppercase tracking-wider text-ink-muted">
              {isTech ? 'Technical Arena' : 'Non-Technical Arena'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-paper hover:bg-ink hover:text-white text-ink brutal-border brutal-shadow transition-colors"
            aria-label="Close Event Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h3
          id="modal-event-title"
          className="font-display font-black text-3xl sm:text-4xl text-ink tracking-tight mb-4"
        >
          {event.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="bg-paper text-ink font-mono text-xs font-semibold px-2.5 py-1 brutal-border"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Official Overview */}
        <div className="mb-6">
          <h4 className="font-space text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
            Official Overview & Objective
          </h4>
          <p className="font-sans text-base text-ink leading-relaxed font-medium bg-paper p-4 brutal-border">
            {event.overview}
          </p>
        </div>

        {/* Key Event Specifications Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3 bg-paper p-3.5 brutal-border">
            <Users className="w-5 h-5 text-electric-blue shrink-0 mt-0.5" />
            <div>
              <div className="font-space text-xs font-bold text-ink-muted uppercase">Participation Format</div>
              <div className="font-sans text-sm font-bold text-ink">{event.teamSize}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-paper p-3.5 brutal-border">
            <Clock className="w-5 h-5 text-vivid-orange shrink-0 mt-0.5" />
            <div>
              <div className="font-space text-xs font-bold text-ink-muted uppercase">Competition Duration</div>
              <div className="font-sans text-sm font-bold text-ink">{event.duration || 'Time-bound'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-paper p-3.5 brutal-border">
            <MapPin className="w-5 h-5 text-ink shrink-0 mt-0.5" />
            <div>
              <div className="font-space text-xs font-bold text-ink-muted uppercase">Assigned Venue</div>
              <div className="font-sans text-sm font-bold text-ink">{event.venue || 'Crescent Campus'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-paper p-3.5 brutal-border">
            <Trophy className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-space text-xs font-bold text-ink-muted uppercase">Recognition</div>
              <div className="font-sans text-sm font-bold text-ink">Certificates & Department Honors</div>
            </div>
          </div>
        </div>

        {/* Rounds Breakdown (if available) */}
        {event.rounds && (
          <div className="mb-8">
            <h4 className="font-space text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Rounds & Format</span>
            </h4>
            <div className="bg-paper p-4 brutal-border font-sans text-sm text-ink font-semibold space-y-1">
              {event.rounds.map((r, i) => (
                <div key={i}>• {r}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-ink">
          <span className="font-mono text-xs text-ink-muted">
            Department of Computer Science & Engineering · Talent Hunt 2K26
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 font-space text-xs font-bold uppercase tracking-wider bg-paper hover:bg-paper-dark text-ink brutal-border"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="flex items-center gap-2 px-6 py-2.5 font-space text-xs sm:text-sm font-bold uppercase tracking-wider bg-vivid-orange hover:bg-vivid-orange-hover text-white brutal-border brutal-shadow brutal-shadow-hover"
            >
              <Sparkles className="w-4 h-4" />
              <span>Register for {event.title}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
