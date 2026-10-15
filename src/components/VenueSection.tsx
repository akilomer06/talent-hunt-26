import { Button } from './ui/button';
import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Navigation, Download, Check, ExternalLink } from 'lucide-react';

export const VenueSection: React.FC = () => {
  const [downloaded, setDownloaded] = useState(false);

  // Generates real .ics file for the event
  const handleDownloadIcs = () => {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Talent Hunt 2K26//Crescent CSE//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'SUMMARY:TALENT HUNT 2K26 - Department of CSE',
      'DESCRIPTION:Flagship Intra-departmental Symposium for CSE students at Crescent Institute. 16 Technical and Non-technical competitions.',
      'LOCATION:Main Auditorium, B.S. Abdur Rahman Crescent Institute of Science and Technology, Vandalur, Chennai',
      'DTSTART:20261026T033000Z',
      'DTEND:20261026T123000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'TALENT_HUNT_2K26.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <section id="venue" className="py-12 sm:py-16 bg-paper-soft text-ink border-b-2 border-ink dark:border-white/20 relative overflow-hidden">
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 opacity-10 bg-halftone-subtle pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Typographic Statement & Map */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="inline-flex items-center gap-1.5 bg-transparent px-2.5 py-0.5 font-mono text-[11px] font-bold text-vivid-orange uppercase tracking-wider self-start">
              <MapPin className="w-3.5 h-3.5" />
              <span>VENUE & MAP</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-tight">
              Main Auditorium,
              <span className="text-electric-blue block">Crescent Campus.</span>
            </h2>

            <p className="font-sans text-sm sm:text-base text-ink-muted font-medium leading-relaxed">
              All 16 competitions, inaugurations, coding arenas, ramp walks, and awards take place inside the university auditorium and computer science labs in Vandalur, Chennai.
            </p>

            {/* Embedded Interactive Google Map */}
            <div className="relative w-full aspect-[16/9] max-h-[280px] bg-paper-soft brutal-border brutal-shadow overflow-hidden">
              <iframe
                title="Crescent Institute Campus Map"
                src="https://maps.google.com/maps?q=B.S.+Abdur+Rahman+Crescent+Institute+of+Science+and+Technology,+Vandalur,+Chennai&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale contrast-125 opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
              <div className="absolute bottom-2 right-2 bg-ink/90 backdrop-blur-sm text-paper px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 brutal-border border-paper/30">
                <a
                  href="https://maps.google.com/?q=B.S.+Abdur+Rahman+Crescent+Institute+of+Science+and+Technology,+Vandalur,+Chennai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-vivid-orange" />
                </a>
              </div>
            </div>

            {/* Quick Action: Add to Calendar */}
            <div>
              <Button variant="festival"
                onClick={handleDownloadIcs}
                className="flex items-center gap-2 bg-vivid-orange hover:bg-vivid-orange-hover text-on-accent px-5 py-2.5 font-space text-xs sm:text-sm font-bold uppercase tracking-wider brutal-border brutal-shadow-blue transition-all"
                aria-label="Add Talent Hunt 2K26 to Calendar"
              >
                {downloaded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Calendar Invite Downloaded (.ics)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Add to Calendar (.ics invite)</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: High-contrast Details Card */}
          <div className="lg:col-span-6">
            <div className="bg-paper text-ink brutal-border-thick brutal-shadow-lg p-5 sm:p-7 relative">
              {/* Top Accent Ribbon */}
              <div className="bg-ink text-paper px-3 py-1 font-mono text-xs font-bold flex items-center justify-between mb-5 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 border-b-2 border-ink">
                <span>VENUE DOSSIER</span>
                <span className="text-vivid-orange">CHENNAI · TAMIL NADU</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Date */}
                <div className="flex items-start gap-3 pb-3 border-b border-ink/25">
                  <div className="p-2 bg-vivid-orange text-on-accent brutal-border shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-space text-[10px] font-bold text-ink-muted uppercase">Date & Day</span>
                    <h4 className="font-display font-bold text-lg text-ink">
                      26 October 2026, Monday
                    </h4>
                    <span className="text-[11px] font-mono text-ink-muted">Reporting Time: 08:30 AM IST</span>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3 pb-3 border-b border-ink/25">
                  <div className="p-2 bg-electric-blue text-on-accent brutal-border shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-space text-[10px] font-bold text-ink-muted uppercase">Schedule</span>
                    <h4 className="font-display font-bold text-lg text-ink">
                      09:00 AM – 05:00 PM IST
                    </h4>
                    <span className="text-[11px] font-mono text-ink-muted">Inauguration, Prelims, Finals & Valedictory</span>
                  </div>
                </div>

                {/* Physical Venue */}
                <div className="flex items-start gap-3 pb-3 border-b border-ink/25">
                  <div className="p-2 bg-ink text-paper brutal-border shrink-0">
                    <Navigation className="w-4 h-4 text-vivid-orange" />
                  </div>
                  <div>
                    <span className="font-space text-[10px] font-bold text-ink-muted uppercase">Exact Location</span>
                    <h4 className="font-display font-bold text-lg text-ink">
                      Main University Auditorium
                    </h4>
                    <p className="font-sans text-xs text-ink-muted mt-0.5 leading-relaxed">
                      B.S. Abdur Rahman Crescent Institute of Science and Technology, GST Road, Vandalur, Chennai 600048.
                    </p>
                  </div>
                </div>

                {/* Campus Guidance */}
                <div className="bg-paper-dark p-3 brutal-border text-xs font-sans text-ink">
                  <strong className="block font-space uppercase mb-0.5">Campus Access:</strong>
                  Enter via Crescent Main Gate (GST Road, opposite Vandalur Zoo). The Auditorium is adjacent to the SCIMS building.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
