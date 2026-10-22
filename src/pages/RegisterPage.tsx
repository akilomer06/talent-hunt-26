import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Download, Plus, X } from 'lucide-react';
import confetti from 'canvas-confetti';
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
  TEAM_RULES,
  validateEventTeams,
  isEventRegistrationClosed,
  closedRegistrationError,
  type EventCategory,
} from '../lib/registration';

interface RegisterPageProps {
  initialEventId?: string;
  onBack: () => void;
}

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
  const [selected, setSelected] = useState<string[]>(initialEventId && !isEventRegistrationClosed(initialEventId) ? [initialEventId] : []);
  const [teams, setTeams] = useState<Record<string, Person[]>>({});
  const hasDetails = (person: Person) => Object.values(person).some(value => value.trim().length > 0);
  const team = selected.flatMap(id => (teams[id] || []).filter(hasDetails).map(person => ({ ...person, event_id: id })));
  const selectedEvents = events.filter(event => selected.includes(event.id));
  const [notice, setNotice] = useState(() => initialEventId ? closedRegistrationError([initialEventId]) || '' : '');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regId, setRegId] = useState('');

  const categoryOf = (id: string) => events.find((e) => e.id === id)?.category as EventCategory | undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggle = (id: string) => {
    const closureError = closedRegistrationError([id]);
    if (closureError) { setNotice(closureError); return; }
    const { next, blocked } = toggleEventSelection(selected, id, categoryOf);
    const cat = categoryOf(id) === 'technical' ? 'technical' : 'non-technical';
    setNotice(blocked ? `You can pick only ${MAX_PER_CATEGORY} ${cat} events. Remove one to swap.` : '');
    setSelected(next);
    if (!blocked && !selected.includes(id) && (TEAM_RULES[id]?.max || 1) > 1) {
      setTeams(current => ({ ...current, [id]: current[id] || Array.from({ length: Math.max(0, (TEAM_RULES[id]?.min || 1) - 1) }, () => emptyPerson()) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setNotice('Pick at least one event.');
      return;
    }
    const closureError = closedRegistrationError(selected);
    if (closureError) { setNotice(closureError); return; }
    const teamError = validateEventTeams(selected, team, me.rrn);
    if (teamError) { setNotice(teamError); return; }
    setNotice('');
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
    setTeams({});
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
            Fill in the form below. Open to CSE, AI&amp;DS, IoT and Cybersecurity students. Bring your
            Crescent ID on the day.
          </p>
        </header>

        <aside className="reg-support" aria-label="Registration help">
          <p><strong>Registration closed: Bid Wars and FIFA.</strong> Other events remain open.</p>
          <p>Each RRN can join an event only once, as registrant or teammate. Already included in a team? Do not register again for that event.</p>
          <p>Need help? Contact <a href="tel:+917338985189">Vijay Hari · +91 733 898 5189</a>.</p>
        </aside>

        <div className="reg-layout">
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
                  <p className="reg-hint">Choose up to one technical and one non-technical event.</p>
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
                            const closed = isEventRegistrationClosed(ev.id);
                            return (
                              <button
                                type="button"
                                key={ev.id}
                                aria-pressed={on}
                                disabled={closed || (!on && full)}
                                aria-label={ev.title}
                                onClick={() => toggle(ev.id)}
                                className={`reg-event${on ? ' is-on' : ''}`}
                              >
                                <span className="reg-tick">{on && <Check className="w-3 h-3" />}</span>
                                {ev.title}
                                {closed && <span className="text-xs font-semibold"> · Registration closed</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                </fieldset>

                <fieldset className="reg-section">
                  <legend><b>03</b> Event teams</legend>
                  <p className="reg-hint">Your details above count as the first participant in each event. Add teammates separately for each selected event.</p>
                  {selectedEvents.length === 0 && <p className="reg-hint">Select an event to see its team requirements.</p>}
                  {selectedEvents.map(event => {
                    const rule = TEAM_RULES[event.id];
                    if (!rule) return null;
                    const minimumTeammates = rule.min - 1;
                    const members = teams[event.id] || Array.from({ length: minimumTeammates }, () => emptyPerson());
                    const filled = members.filter(hasDetails).length;
                    const updateMembers = (next: Person[]) => setTeams(current => ({ ...current, [event.id]: next }));
                    return (
                      <section key={event.id} className="reg-team" aria-label={event.title + ' team'}>
                        <h3 className="reg-team-title">{event.title}</h3>
                        {rule.max === 1 ? <p className="reg-hint">Individual event · only you. No teammates needed.</p> : <>
                          <p className="reg-hint">Team size: min {rule.min}, max {rule.max} participants, including you.
                            {rule.substitute && ' Four main players and one optional substitute.'}
                          </p>
                          <p className="reg-team-count">Teammates: min {rule.min - 1}, max {rule.max - 1} · {filled} added
                            {rule.min === 1 && ' · You can enter individually or add optional teammates below.'}
                          </p>
                          {members.map((person, index) => (
                            <div key={index} className="reg-member">
                              <div className="reg-member-head">
                                <h4>{rule.substitute && index === rule.max - 2 ? 'Optional substitute' : 'Teammate ' + (index + 1)}</h4>
                                {index >= minimumTeammates && <button type="button" onClick={() => updateMembers(members.filter((_, i) => i !== index))} aria-label={'Remove ' + event.title + ' teammate ' + (index + 1)}><X className="w-4 h-4" /></button>}
                              </div>
                              <PersonFields value={person} required prefix={event.id + '-tm' + index}
                                onChange={next => updateMembers(members.map((value, i) => i === index ? next : value))} />
                            </div>
                          ))}
                          {members.length < rule.max - 1 && <button type="button" className="reg-add" onClick={() => updateMembers([...members, emptyPerson()])}>
                            <Plus className="w-4 h-4" /> Add {event.title} teammate
                          </button>}
                          {members.length === rule.max - 1 && <p className="reg-hint">Maximum teammate slots reached.</p>}
                        </>}
                      </section>
                    );
                  })}
                </fieldset>

                {notice && <p className="reg-notice" role="alert">{notice}</p>}
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
                              `${events.find(event => event.id === t.event_id)?.title || t.event_id}: ${t.name} ${t.department ? `(${t.department}${t.section ? ` Sec ${t.section}` : ''})` : ''}`
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
                <aside className="reg-community" aria-label="Event WhatsApp groups">
                  <h3>Join your event groups</h3>
                  <p>Your registration is confirmed! Open the WhatsApp link below and join the respective groups for your selected events to receive updates and instructions.</p>
                  <a href="https://chat.whatsapp.com/BTP5Q9gmCLRLyXJvUVdQtE" target="_blank" rel="noopener noreferrer">
                    Join on WhatsApp <ArrowUpRight className="w-4 h-4" />
                  </a>
                </aside>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
