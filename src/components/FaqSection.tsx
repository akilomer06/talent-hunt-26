import { Button } from './ui/button';
import { useState } from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';

const FAQS = [
  { q: 'Who can take part?', a: 'TALENT HUNT 2K26 is only for students of the Department of CSE, B.S. Abdur Rahman Crescent Institute of Science & Technology.' },
  { q: 'When and where is it?', a: 'Monday, 26 October 2026, at the Crescent campus. Each event page lists its own venue.' },
  { q: 'How many events can I join?', a: 'You can register for up to one technical and one non-technical event, as long as their timings do not clash.' },
  { q: 'What are the team sizes?', a: 'It depends on the event. Open any event page to see its team size, rules and judging criteria.' },
  { q: 'How do I register?', a: 'Use the Register button on the site or on any event page. Registration details will be announced by the coordinators.' },
  { q: 'Is there a registration fee?', a: 'Any fee details will be shared by the coordinators along with the official registration link.' },
  { q: 'Who do I contact with questions?', a: 'Reach out to the coordinators listed in the Coordinators section of this site.' },
];

export function FaqSection({ compact = false, onSeeAll }: { compact?: boolean; onSeeAll?: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const list = compact ? FAQS.slice(0, 4) : FAQS;

  return (
    <section id="faqs" className={`faq-section bg-paper text-ink ${compact ? 'py-20' : 'pt-28 pb-24 min-h-screen'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="inline-block px-3 py-1 brutal-border font-space text-xs font-bold uppercase tracking-wider mb-4">FAQs</span>
        {compact ? <h2 className="font-display text-4xl sm:text-5xl font-black mb-10">Got Questions?</h2> : <h1 className="font-display text-4xl sm:text-5xl font-black mb-10">Got Questions?</h1>}
        <div className="space-y-3">
          {list.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="bg-paper-soft brutal-border brutal-shadow">
                <Button variant="festivalGhost"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-space font-bold uppercase text-sm tracking-wide"
                >
                  <span>{f.q}</span>
                  {isOpen ? <Minus className="w-4 h-4 shrink-0 text-vivid-orange" /> : <Plus className="w-4 h-4 shrink-0" />}
                </Button>
                {isOpen && <p className="px-5 pb-5 text-ink-muted leading-relaxed">{f.a}</p>}
              </div>
            );
          })}
        </div>
        {compact && onSeeAll && (
          <Button variant="festivalGhost"
            onClick={onSeeAll}
            className="mt-8 inline-flex items-center gap-2 bg-ink text-paper px-5 py-3 font-space text-xs font-bold uppercase tracking-wider brutal-border brutal-shadow hover:-translate-y-0.5 transition-transform"
          >
            All FAQs <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </section>
  );
}
