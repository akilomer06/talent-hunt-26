import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Users,
  Clock,
  MapPin,
  Sparkles,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Share2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Check,
  Code2,
  Layout,
  Brain,
  Cpu,
  Gamepad2,
  Mic2,
  ShieldAlert,
  Camera,
  Search,
  Shirt,
  PlayCircle,
  Crosshair,
  Flame,
  Gavel
} from 'lucide-react';
import { useLiveContent } from '../hooks/useLiveContent';
import { EVENT_THEMES } from '../data/eventThemes';
import { Button } from '@/components/ui/button';
import { isEventRegistrationClosed } from '../lib/registration';

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
  onNavigateEvent: (id: string) => void;
  onRegisterEvent: (eventId: string) => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  eventId,
  onBack,
  onNavigateEvent,
  onRegisterEvent,
}) => {
  const { events } = useLiveContent();
  const event = events.find((e) => e.id === eventId) || events[0];
  if (!event) return null;
  const isTech = event.category === 'technical';
  const registrationClosed = isEventRegistrationClosed(event.id);
  const theme = {
    tagline: EVENT_THEMES[event.id]?.tagline || event.shortDesc,
    themeTag: isTech ? 'Technical Arena' : 'Non-Technical Showdown',
    badgeBg: 'bg-electric-blue/10 text-electric-blue',
  };


  // Find index for prev/next navigation
  const currentIndex = events.findIndex((e) => e.id === event.id);
  const prevEvent = currentIndex > 0 ? events[currentIndex - 1] : null;
  const nextEvent = currentIndex < events.length - 1 ? events[currentIndex + 1] : null;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${event.title} (Event #${event.number}) — TALENT HUNT 2K26`;
  }, [event]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${event.title} — Talent Hunt 2K26`,
        text: event.shortDesc,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="detail-reading min-h-screen bg-paper text-ink pt-20 pb-20">
      <div className="detail-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb Bar */}
        <div className="detail-toolbar flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="festivalOutline"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 bg-paper-soft hover:bg-ink hover:text-paper-soft text-ink px-3 py-1.5 font-space text-xs font-bold uppercase tracking-wider brutal-border brutal-shadow transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← All Events</span>
            </Button>

            {/* Breadcrumb Path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-ink-muted">
              <span>TALENT HUNT 2K26</span>
              <span>/</span>
              <span>EVENTS</span>
              <span>/</span>
              <span className="font-bold text-ink" >
                {event.title.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="festivalOutline"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-soft hover:bg-paper-dark text-ink brutal-border text-xs font-space font-bold uppercase transition-colors"
              title="Share event link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-electric-blue" />
                  <span className="text-electric-blue">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </Button>

            <Button variant="festival"
              disabled={registrationClosed}
              onClick={() => onRegisterEvent(event.id)}
              className="inline-flex items-center gap-1.5 bg-vivid-orange hover:bg-vivid-orange-hover text-on-accent px-4 py-1.5 font-space text-xs font-bold uppercase tracking-wider brutal-border brutal-shadow transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{registrationClosed ? 'Registration closed' : 'Register'}</span>
            </Button>
          </div>
        </div>

        <header className="detail-intro">
          <p className="detail-eyebrow"><span>Event {event.number}</span><span>{theme.themeTag}</span></p>
          <h1>{event.title}</h1>
          {theme.tagline !== event.shortDesc && <p className="detail-tagline">{theme.tagline}</p>}
          <p className="detail-description">{event.shortDesc}</p>
          {registrationClosed && <p className="text-sm font-semibold text-vivid-orange mt-3">Registration is closed for this event.</p>}
        </header>

        {/* 2-Column Responsive Layout: Left Description & Rules, Right Themed Event Card */}
        <div className="detail-layout grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Event Description, Format, Rules, & Judging Criteria (lg:col-span-7 xl:col-span-8) */}
          <div className="detail-content lg:col-span-7 xl:col-span-8">
            {/* 01. Event Overview & Objective */}
            <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
              <h2 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight mb-4 flex items-center gap-2">
                <span className="text-electric-blue">01.</span>
                <span>Event Overview</span>
              </h2>

              <div className="bg-paper p-4 sm:p-5 brutal-border text-sm sm:text-base text-ink leading-relaxed font-normal">
                {event.overview}
              </div>

              {event.materials && (
                <div className="mt-4 p-3.5 bg-paper brutal-border flex items-start gap-2.5 text-xs sm:text-sm font-mono text-ink">
                  <span className="font-bold text-vivid-orange shrink-0">Permitted Materials:</span>
                  <span>{event.materials}</span>
                </div>
              )}
            </section>

            {/* 02. Format & Rounds */}
            {event.rounds && event.rounds.length > 0 && (
              <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight mb-4 flex items-center gap-2">
                  <span className="text-electric-blue">02.</span>
                  <span>Competition Format & Rounds</span>
                </h2>
                <div className="space-y-3">
                  {event.rounds.map((round, idx) => (
                    <div key={idx} className="bg-paper p-3.5 sm:p-4 brutal-border flex items-start gap-3">
                      <span
                        className="w-6 h-6 bg-electric-blue text-on-accent font-mono text-xs font-bold flex items-center justify-center shrink-0 brutal-border"
                        
                      >
                        R{idx + 1}
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-ink font-medium leading-relaxed">
                        {round}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Schedule Table (for Cyber Breach, etc.) */}
            {event.scheduleTable && (
              <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-vivid-orange" />
                  <span>Competition Schedule Breakdown</span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm font-sans brutal-border bg-paper">
                    <thead className="bg-ink text-paper font-space text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3 border-r border-paper/20">Time Window</th>
                        <th className="p-3">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {event.scheduleTable.map((item, idx) => (
                        <tr key={idx} className="hover:bg-paper-soft transition-colors">
                          <td className="p-3 font-mono font-bold text-vivid-orange border-r border-ink/25 whitespace-nowrap">
                            {item.time}
                          </td>
                          <td className="p-3 text-ink font-medium">{item.activity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Squad Table (for Bid Wars) */}
            {event.squadTable && (
              <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight mb-4 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-electric-blue" />
                  <span>Mandatory 13-Player Squad Roster</span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm font-sans brutal-border bg-paper">
                    <thead className="bg-ink text-paper font-space text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3 border-r border-paper/20">Player Category</th>
                        <th className="p-3 text-right">Minimum Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10 font-mono">
                      {event.squadTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-paper-soft transition-colors">
                          <td className="p-3 font-bold text-ink border-r border-ink/25">
                            {row.category}
                          </td>
                          <td className="p-3 text-right font-extrabold text-vivid-orange">
                            {row.minimum}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-paper-dark font-bold text-ink">
                        <td className="p-3 border-r border-ink/25">Total Squad Size</td>
                        <td className="p-3 text-right font-extrabold text-ink">Exactly 13 Players</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 03. Rules and Regulations */}
            <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
              <h2 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight mb-4 flex items-center gap-2">
                <span className="text-electric-blue">03.</span>
                <span>Rules & Regulations</span>
              </h2>
              <div className="space-y-2.5">
                {event.rules.map((rule, idx) => (
                  <div key={idx} className="bg-paper p-3 sm:p-3.5 brutal-border flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-vivid-orange shrink-0 mt-0.5" />
                    <p className="font-sans text-xs sm:text-sm text-ink leading-relaxed font-medium">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 04. Judging Criteria Table */}
            {event.judgingCriteria && event.judgingCriteria.length > 0 && (
              <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-electric-blue" />
                  <span>Evaluation & Judging Criteria</span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm font-sans brutal-border bg-paper">
                    <thead className="bg-ink text-paper font-space text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3 border-r border-paper/20">Criterion</th>
                        {event.judgingCriteria.some((c) => c.marks !== undefined) && (
                          <th className="p-3 text-right w-24">Marks</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {event.judgingCriteria.map((crit, idx) => (
                        <tr key={idx} className="hover:bg-paper-soft transition-colors">
                          <td className="p-3 text-ink font-medium border-r border-ink/25">
                            {crit.criterion}
                          </td>
                          {crit.marks !== undefined && (
                            <td className="p-3 text-right font-mono font-extrabold text-vivid-orange">
                              {crit.marks}
                            </td>
                          )}
                        </tr>
                      ))}
                      {event.judgingCriteria.some((c) => typeof c.marks === 'number') && (
                        <tr className="bg-paper-dark font-bold text-ink">
                          <td className="p-3 border-r border-ink/25">Total Maximum Score</td>
                          <td className="p-3 text-right font-mono font-extrabold text-ink">
                            {event.judgingCriteria.reduce(
                              (acc, c) => acc + (typeof c.marks === 'number' ? c.marks : 0),
                              0
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 05. Disqualification & Winning Rules */}
            {(event.disqualification || event.winnerSelection) && (
              <section className="bg-paper-soft brutal-border brutal-shadow p-5 sm:p-7">
                {event.winnerSelection && (
                  <div className="mb-5">
                    <h3 className="font-display font-bold text-lg text-ink mb-2">
                      Winner Selection
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-ink bg-paper p-3.5 brutal-border leading-relaxed">
                      {event.winnerSelection}
                    </p>
                  </div>
                )}

                {event.disqualification && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-electric-blue mb-2.5 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Disqualification Criteria</span>
                    </h3>
                    <div className="space-y-2">
                      {event.disqualification.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-paper-soft brutal-border border-ink/20 p-2.5 text-xs text-ink font-medium"
                        >
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 06. Special Notes & Awards */}
            {(event.specialNotes || event.prizes || event.announcements) && (
              <section className="bg-paper p-5 sm:p-7 brutal-border">
                <h3 className="font-space text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                  Official Advisories & Awards
                </h3>

                {event.specialNotes && (
                  <div className="space-y-2 mb-3">
                    {event.specialNotes.map((note, idx) => (
                      <div key={idx} className="text-xs font-sans text-ink bg-paper-soft p-2.5 brutal-border">
                        ℹ️ {note}
                      </div>
                    ))}
                  </div>
                )}

                {event.prizes && (
                  <div className="bg-paper-soft p-3.5 brutal-border mb-3">
                    <span className="font-mono text-xs font-bold uppercase text-vivid-orange block mb-2">
                      Prizes (Subject to Department Confirmation):
                    </span>
                    <div className="flex flex-wrap gap-4 font-mono text-xs font-bold text-ink">
                      <span>1st Place: {event.prizes.first}</span>
                      <span>2nd Place: {event.prizes.second}</span>
                      <span>3rd Place: {event.prizes.third}</span>
                    </div>
                  </div>
                )}

                {event.announcements && (
                  <div className="text-xs font-mono text-ink-muted">
                    📢 {event.announcements}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: The Sticky Dedicated THEMED EVENT CARD (lg:col-span-5 xl:col-span-4) */}
          <div className="detail-sidebar lg:col-span-5 xl:col-span-4 lg:sticky space-y-4">
            {/* The Themed Event Card */}
            <div className="bg-paper-soft brutal-border-thick brutal-shadow-lg p-5 sm:p-6 relative overflow-hidden">
              <p className="detail-eyebrow">Event {event.number}</p>
              <h2 className="detail-facts-title">At a glance</h2>

              {/* Event Specs Grid */}
              <div className="space-y-2.5 bg-paper p-3.5 brutal-border mb-5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-ink/25">
                  <div className="flex items-center gap-1.5 text-ink-muted font-space uppercase font-bold text-[10px]">
                    <Users className="w-3.5 h-3.5 text-ink" />
                    <span>Format</span>
                  </div>
                  <span className="font-sans font-bold text-ink">{event.teamSize}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-ink/25">
                  <div className="flex items-center gap-1.5 text-ink-muted font-space uppercase font-bold text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-vivid-orange" />
                    <span>Duration</span>
                  </div>
                  <span className="font-sans font-bold text-ink">
                    {event.duration || 'Full session'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-ink/25">
                  <div className="flex items-center gap-1.5 text-ink-muted font-space uppercase font-bold text-[10px]">
                    <MapPin className="w-3.5 h-3.5 text-electric-blue" />
                    <span>Venue</span>
                  </div>
                  <span className="font-sans font-bold text-ink text-right max-w-[180px]">
                    {event.venue || 'Campus Auditorium'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-ink/25">
                  <div className="flex items-center gap-1.5 text-ink-muted font-space uppercase font-bold text-[10px]">
                    <Calendar className="w-3.5 h-3.5 text-electric-blue" />
                    <span>Date</span>
                  </div>
                  <span className="font-mono font-bold text-ink">26 OCT 2026</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-ink-muted font-space uppercase font-bold text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                    <span>Eligibility</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-electric-blue">
                    CSE / AIDS / PG
                  </span>
                </div>
              </div>

              {/* Primary Fast Register CTA Button */}
              <Button variant="festival"
                disabled={registrationClosed}
                onClick={() => onRegisterEvent(event.id)}
                className="w-full flex items-center justify-center gap-2 bg-vivid-orange hover:bg-vivid-orange-hover text-on-accent py-3.5 px-4 font-space text-xs sm:text-sm font-bold uppercase tracking-wider brutal-border brutal-shadow hover:-translate-y-0.5 transition-all mb-3"
              >
                <Sparkles className="w-4 h-4" />
                <span>{registrationClosed ? 'Registration closed' : `Register for ${event.title}`}</span>
              </Button>

              {/* Share Button */}
              <Button variant="festivalOutline"
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-1.5 bg-paper hover:bg-paper-dark text-ink py-2 px-3 font-space text-xs font-bold uppercase brutal-border transition-colors mb-4"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied!' : 'Share Event Specs'}</span>
              </Button>

              {/* Prev / Next Navigation Bar */}
              <div className="pt-3 border-t border-ink/25 flex items-center justify-between gap-2">
                {prevEvent ? (
                  <Button variant="festivalOutline"
                    onClick={() => onNavigateEvent(prevEvent.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-paper hover:bg-ink hover:text-paper-soft text-ink py-1.5 px-2 brutal-border text-[11px] font-mono font-bold transition-colors truncate"
                    title={`Previous: #${prevEvent.number} ${prevEvent.title}`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">#{prevEvent.number} {prevEvent.title}</span>
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}

                {nextEvent ? (
                  <Button variant="festivalOutline"
                    onClick={() => onNavigateEvent(nextEvent.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-paper hover:bg-ink hover:text-paper-soft text-ink py-1.5 px-2 brutal-border text-[11px] font-mono font-bold transition-colors truncate"
                    title={`Next: #${nextEvent.number} ${nextEvent.title}`}
                  >
                    <span className="truncate">#{nextEvent.number} {nextEvent.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>

            {/* Department Entry Reminder */}
            <div className="bg-paper p-3.5 brutal-border text-xs font-sans text-ink-muted">
              <span className="font-bold text-ink block font-space uppercase mb-1">
                Official Department Directive:
              </span>
              Valid Crescent student identity card is mandatory during physical check-in on event morning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
