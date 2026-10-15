import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Download, Plus, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import qrAsset from '../assets/qr-code.png';
import { submitRegistration } from '../lib/supabase';
import { useLiveContent } from '../hooks/useLiveContent';
import {
  DEPARTMENTS,
  MAX_PER_CATEGORY,
  PROGRAMMES,
  YEARS,
  hasSection,
  getSectionsForDepartment,
  toggleEventSelection,
  type EventCategory,
} from '../lib/registration';

interface RegisterPageProps {
  initialEventId?: string;
  onBack: () => void;
}

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeE1heCwcf6SR22IGbva0CaDPljSZsOaNKwm1MakO6c6roA-A/viewform';

interface Person {
  name: string;
  rrn: string;
  mobile: string;
  programme: string;
  year: string;
  department: string;
  section?: string;
}
const emptyPerson = (): Person => ({
  name: '',
  rrn: '',
  mobile: '',
  programme: '',
  year: '',
  department: '',
  section: '',
});

const PersonFields: React.FC<{
  value: Person;
  onChange: (p: Person) => void;
  required?: boolean;
  prefix: string;
}> = ({ value, onChange, required, prefix }) => {
  const set = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });
  const req = required ? ' *' : '';

  const isSectionApplicable = hasSection(value.department);
  const sections = getSectionsForDepartment(value.department);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDept = e.target.value;
    onChange({
      ...value,
      department: newDept,
      section: hasSection(newDept) ? value.section || '' : '',
    });
  };

  return (
    <div className="reg-grid">
      <label className="reg-field reg-span-2">
        <span>Name{req}</span>
        <input required={required} value={value.name} onChange={set('name')} maxLength={100} />
      </label>
      <label className="reg-field">
        <span>RRN{req}</span>
        <input required={required} value={value.rrn} onChange={set('rrn')} maxLength={20} inputMode="numeric" />
      </label>
      <label className="reg-field">
        <span>Mobile number{req}</span>
        <input
          required={required}
          type="tel"
          value={value.mobile}
          onChange={set('mobile')}
          pattern="[0-9]{10}"
          title="10-digit mobile number"
          maxLength={10}
        />
      </label>

      <label className="reg-field">
        <span>Programme{req}</span>
        <select id={`${prefix}-programme`} required={required} value={value.programme} onChange={set('programme')}>
          <option value="">Choose</option>
          {PROGRAMMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label className="reg-field">
        <span>Year of study{req}</span>
        <select id={`${prefix}-year`} required={required} value={value.year} onChange={set('year')}>
          <option value="">Choose</option>
          {YEARS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label className={`reg-field ${isSectionApplicable ? '' : 'reg-span-2'}`}>
        <span>Department{req}</span>
        <select
          id={`${prefix}-department`}
          required={required}
          value={value.department}
          onChange={handleDepartmentChange}
        >
          <option value="">Choose</option>
          {DEPARTMENTS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      {isSectionApplicable && (
        <label className="reg-field">
          <span>Section{req}</span>
          <select
            id={`${prefix}-section`}
            required={required}
            value={value.section || ''}
            onChange={set('section')}
          >
            <option value="">Choose Section</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};

export const RegisterPage: React.FC<RegisterPageProps> = ({ initialEventId, onBack }) => {
  const { events, settings } = useLiveContent();
  const [me, setMe] = useState<Person>(emptyPerson);
  const [selected, setSelected] = useState<string[]>(initialEventId ? [initialEventId] : []);
  const [team, setTeam] = useState<Person[]>([]);
  const [notice, setNotice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regId, setRegId] = useState('');

  const categoryOf = (id: string) => events.find((e) => e.id === id)?.category as EventCategory | undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggle = (id: string) => {
    const { next, blocked } = toggleEventSelection(selected, id, categoryOf);
    const cat = categoryOf(id) === 'technical' ? 'technical' : 'non-technical';
    setNotice(blocked ? `You can pick only ${MAX_PER_CATEGORY} ${cat} events. Remove one to swap.` : '');
    setSelected(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setNotice('Pick at least one event.');
      return;
    }
    const newId = `TH26-${Math.floor(1000 + Math.random() * 9000)}`;
    setRegId(newId);
    setSubmitting(true);

    try {
      await submitRegistration({
        reg_id: newId,
        name: me.name,
        rrn: me.rrn,
        mobile: me.mobile,
        programme: me.programme,
        year: me.year,
        department: me.department,
        section: me.section || '',
        selected_events: selected,
        team_members: team,
      });
      setSubmitted(true);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setMe(emptyPerson());
    setSelected([]);
    setTeam([]);
    setSubmitted(false);
  };

  const groups: { key: EventCategory; title: string }[] = [
    { key: 'technical', title: 'Technical' },
    { key: 'non-technical', title: 'Non-technical' },
  ];

  return (
    <div className="register-reading reg-page">
      <div className="reg-wrap">
        <button onClick={onBack} className="reg-back">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <header className="reg-head">
          <p className="reg-kicker">Registration · 26 October 2026</p>
          <h1>Register for Talent Hunt 2K26</h1>
          <p className="reg-lede">
            Scan the QR or fill in the form below. Open to CSE, AI&amp;DS, IoT and Cybersecurity students. Bring your
            Crescent ID on the day.
          </p>
        </header>

        <div className="reg-layout">
          <aside className="reg-qr">
            <img src={qrAsset} alt="QR code for the Talent Hunt 2K26 registration form" />
            <p>Scan with your phone camera</p>
            <a href={FORM_URL} target="_blank" rel="noopener noreferrer" className="reg-link">
              Open Google Form <ArrowUpRight className="w-4 h-4" />
            </a>
          </aside>

          <section className="reg-card">
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <fieldset className="reg-section">
                  <legend>
                    <b>01</b> Your details
                  </legend>
                  <PersonFields value={me} onChange={setMe} required prefix="me" />
                </fieldset>

                <fieldset className="reg-section">
                  <legend>
                    <b>02</b> Events
                  </legend>
                  <p className="reg-hint">Up to {MAX_PER_CATEGORY} technical and {MAX_PER_CATEGORY} non-technical.</p>
                  {groups.map((g) => {
                    const list = events.filter((e) => e.category === g.key);
                    const count = selected.filter((id) => categoryOf(id) === g.key).length;
                    const full = count >= MAX_PER_CATEGORY;
                    return (
                      <div key={g.key} className="reg-group">
                        <div className="reg-group-head">
                          <h3>{g.title}</h3>
                          <span className={full ? 'is-full' : ''}>
                            {count}/{MAX_PER_CATEGORY}
                          </span>
                        </div>
                        <div className="reg-events">
                          {list.map((ev) => {
                            const on = selected.includes(ev.id);
                            return (
                              <button
                                type="button"
                                key={ev.id}
                                aria-pressed={on}
                                disabled={!on && full}
                                onClick={() => toggle(ev.id)}
                                className={`reg-event${on ? ' is-on' : ''}`}
                              >
                                <span className="reg-tick">{on && <Check className="w-3 h-3" />}</span>
                                {ev.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {notice && (
                    <p className="reg-notice" role="status">
                      {notice}
                    </p>
                  )}
                </fieldset>

                <fieldset className="reg-section">
                  <legend>
                    <b>03</b> Team members <em>optional · team events only</em>
                  </legend>
                  {team.map((p, i) => (
                    <div key={i} className="reg-member">
                      <div className="reg-member-head">
                        <h3>Team member {i + 1}</h3>
                        <button
                          type="button"
                          onClick={() => setTeam(team.filter((_, j) => j !== i))}
                          aria-label={`Remove team member ${i + 1}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <PersonFields
                        value={p}
                        required
                        prefix={`tm${i}`}
                        onChange={(np) => setTeam(team.map((x, j) => (j === i ? np : x)))}
                      />
                    </div>
                  ))}
                  {team.length < 2 && (
                    <button type="button" className="reg-add" onClick={() => setTeam([...team, emptyPerson()])}>
                      <Plus className="w-4 h-4" /> Add team member {team.length + 1}
                    </button>
                  )}
                </fieldset>

                <button type="submit" disabled={submitting} className="reg-submit">
                  {submitting ? 'Registering...' : 'Confirm registration'} <ArrowUpRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="reg-done">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
                <p className="reg-kicker">Official entry registered</p>
                <h2>{me.name}</h2>
                <p className="reg-id">{regId}</p>
                <dl>
                  <dt>RRN</dt>
                  <dd>{me.rrn}</dd>
                  <dt>Programme & Class</dt>
                  <dd>
                    {me.programme} {me.department} {me.section ? `(Section ${me.section})` : ''} · Year {me.year}
                  </dd>
                  <dt>Events</dt>
                  <dd>{selected.map((id) => events.find((e) => e.id === id)?.title || id).join(', ')}</dd>
                  {team.length > 0 && (
                    <>
                      <dt>Team</dt>
                      <dd>
                        {team
                          .map(
                            (t) =>
                              `${t.name} ${t.department ? `(${t.department}${t.section ? ` Sec ${t.section}` : ''})` : ''}`
                          )
                          .join(', ')}
                      </dd>
                    </>
                  )}
                </dl>
                <div className="reg-done-actions">
                  <button onClick={() => window.print()} className="reg-submit">
                    <Download className="w-4 h-4" /> Print pass
                  </button>
                  <button onClick={reset} className="reg-add">
                    New entry
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
