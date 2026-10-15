import { useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import {
  CONVENORS,
  FACULTY_COORDINATORS,
  STUDENT_COORDINATORS,
  TECHNICAL_EVENT_COORDINATORS,
  NON_TECHNICAL_EVENT_COORDINATORS,
} from '../data/coordinatorsData';

const PHONE = '+91 XXXXX XXXXX'; // placeholder — replace with real numbers

const sections = [
  ['convenors', 'Convenors', CONVENORS.length],
  ['faculty', 'Faculty Coordinators', FACULTY_COORDINATORS.length],
  ['students', 'Student Coordinators', STUDENT_COORDINATORS.length],
  ['technical', 'Technical Event Coordinators', TECHNICAL_EVENT_COORDINATORS.length],
  ['nontechnical', 'Non-Technical Event Coordinators', NON_TECHNICAL_EVENT_COORDINATORS.length],
] as const;
type CrewSection = (typeof sections)[number][0];

const groups = [['ALL', 'All'], ['CSE', 'CSE'], ['AIDS', 'AI&DS'], ['PG', 'M.Tech']] as const;

export function CoordinatorsSection() {
  const [section, setSection] = useState<CrewSection>('convenors');
  const [filter, setFilter] = useState<'ALL' | 'CSE' | 'AIDS' | 'PG'>('ALL');
  const students = STUDENT_COORDINATORS.filter(s => filter === 'ALL' || s.category === filter);
  return <section id="coordinators" className="crew-page">
    <div className="section-inner">
      <p className="crew-lede">Convenors, faculty, student, and event coordinators who make Talent Hunt happen.</p>

      <div className="crew-tabrow" role="group" aria-label="Coordinator groups">
        {sections.map(([key, label, count]) => (
          <button key={key} type="button" className="crew-tab" aria-pressed={section === key} onClick={() => setSection(key)}>
            {label}
            <span className="crew-count">{count}</span>
          </button>
        ))}
      </div>

      {section === 'convenors' && (
        <div className="crew-grid">
          {CONVENORS.map(c => (
            <article key={c.name} className="crew-card">
              <p className="crew-kicker">Convenor · {c.title}</p>
              <h3>{c.name}</h3>
              <p className="crew-meta">{c.department}</p>
            </article>
          ))}
        </div>
      )}

      {section === 'faculty' && (
        <div className="crew-grid">
          {FACULTY_COORDINATORS.map(f => (
            <article key={f.name} className="crew-card">
              <p className="crew-kicker">{f.title} · {f.department}</p>
              <h3>{f.name}</h3>
            </article>
          ))}
        </div>
      )}

      {section === 'students' && (
        <>
          <div className="crew-subtabs" role="group" aria-label="Filter student coordinators">
            {groups.map(([k, l]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="crew-grid">
            {students.map((s, i) => (
              <article key={s.name} className="crew-card">
                <p className="crew-index">{String(i + 1).padStart(2, '0')}</p>
                <p className="crew-kicker">{s.role} · {s.section}</p>
                <h3>{s.name}</h3>
                <div className="crew-actions">
                  <a href="tel:+910000000000" aria-label={`Call ${s.name} (${PHONE})`}><Phone/> Call</a>
                  <a href="https://wa.me/910000000000" target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${s.name}`}><MessageCircle/> WhatsApp</a>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {section === 'technical' && (
        <div className="crew-grid">
          {TECHNICAL_EVENT_COORDINATORS.map(e => (
            <article key={e.event} className="crew-card">
              <p className="crew-kicker">{e.event} · Event Coordinator</p>
              <h3>{e.name}</h3>
            </article>
          ))}
        </div>
      )}

      {section === 'nontechnical' && (
        <div className="crew-grid">
          {NON_TECHNICAL_EVENT_COORDINATORS.map(e => (
            <article key={e.event} className="crew-card">
              <p className="crew-kicker">{e.event} · Event Coordinator</p>
              <h3>{e.name}</h3>
            </article>
          ))}
        </div>
      )}
    </div>
  </section>;
}
