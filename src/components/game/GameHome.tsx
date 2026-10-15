import { useMemo, useState } from 'react';
import { Play, Crosshair, Users, Swords, Trophy, MapPin, CalendarDays, Gamepad2, Zap, Search, ArrowUpRight } from 'lucide-react';
import { EVENTS } from '../../data/eventsData';
import { useCountdown } from '../../hooks/useCountdown';
import logoImg from '../../assets/talent-hunt-logo-white.png';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { GameArtwork, ArcadeBackdrop } from './GameArtwork';
import { GameCursor } from './GameCursor';
import { brochureUrl as posterImg, downloadBrochure } from '../../lib/brochure';

type Mode = 'all' | 'technical' | 'non-technical';

function HudCountdown() {
  const { days, hours, minutes, seconds, isComplete } = useCountdown('2026-10-26T09:00:00+05:30');
  if (isComplete) return <p className="gm-pixel gm-blink text-gm-lime">GAME IN PROGRESS</p>;
  const units = [['DAYS', days], ['HRS', hours], ['MIN', minutes], ['SEC', seconds]] as const;
  return (
    <div className="gm-countdown" aria-label="Event countdown">
      {units.map(([l, v]) => (
        <div key={l} className="gm-count-cell">
          <strong className="gm-pixel">{String(v).padStart(2, '0')}</strong>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

export function GameHome({ onRegister, onOpenEvent, track }: { onRegister: () => void; onOpenEvent: (id: string) => void; track?: 'technical' | 'non-technical' }) {
  const [posterOpen, setPosterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<Mode>(track ?? 'all');
  const levels = useMemo(() => EVENTS.filter((e) => ((track ?? mode) === 'all' || e.category === (track ?? mode)) && (!search.trim() || `${e.title} ${e.shortDesc} ${e.tags.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))), [mode, search, track]);
  const scrollToLevels = () => document.getElementById('levels')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="gm-root">
      <GameCursor />
      {!track && <>
      {/* TITLE SCREEN */}
      <section id="hero" className="gm-hero">
        <div className="gm-grid-floor" aria-hidden />
        <ArcadeBackdrop />
        <div className="gm-hero-inner">
          <p className="gm-chip"><Zap className="w-3.5 h-3.5" /> DEPT. OF CSE PRESENTS</p>
          <img src={logoImg} alt="Talent Hunt 2K26 logo" className="gm-logo" />
          <h1 className="gm-title gm-pixel"><span data-text="TALENT">TALENT</span><span data-text="HUNT">HUNT</span></h1>
          <p className="gm-subtitle gm-pixel">2K26 <span>· 16 EVENTS · ONE ARENA</span></p>

          <div className="gm-hud-row">
            <div className="gm-hud"><CalendarDays /><div><small>DATE</small><b>26 OCT 2026 · MON</b></div></div>
            <div className="gm-hud"><MapPin /><div><small>WORLD</small><b>Crescent Institute</b></div></div>
            <div className="gm-hud"><Users /><div><small>PLAYERS</small><b>CSE students only</b></div></div>
          </div>

          <HudCountdown />

          <div className="gm-actions">
            <Button variant="game" className="gm-btn gm-btn-primary" onClick={onRegister}><Play className="w-4 h-4" /> PRESS START</Button>
            <Button variant="game" className="gm-btn gm-btn-ghost" onClick={scrollToLevels}><Crosshair className="w-4 h-4" /> SELECT LEVEL</Button>
          </div>
          <Button variant="game" className="gm-brochure-link" onClick={() => setPosterOpen(true)} aria-label="Open official brochure">Official brochure <Zap className="w-4 h-4" /></Button>
        </div>
      </section>

      {/* TICKER */}
      <div className="gm-ticker" aria-hidden>
        <div>{Array.from({ length: 2 }).map((_, k) => <span key={k}>★ 16 LEVELS ★ TECH + NON-TECH MODES ★ SOLO & SQUAD ★ LOOT FOR WINNERS ★ 26.10.2026 ★ CRESCENT INSTITUTE&nbsp;</span>)}</div>
      </div>

      </>}
      {/* LEVEL SELECT */}
      <section id="levels" className="gm-section">
        <div className="gm-sec-head">
          <p className="gm-chip"><Gamepad2 className="w-3.5 h-3.5" /> WORLD 1</p>
          {!track && <h2 className="gm-pixel gm-h2">SELECT YOUR LEVEL</h2>}
          <div className="gm-level-controls"><div className={`gm-modes ${track ? 'gm-hide' : ''}`} role="group" aria-label="Event categories">
            {(['all', 'technical', 'non-technical'] as Mode[]).map((m) => (
              <Button variant="game" key={m} aria-pressed={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>
                {m === 'all' ? 'ALL' : m === 'technical' ? 'TECH MODE' : 'FUN MODE'}
              </Button>
            ))}
          </div><label className="gm-search"><Search aria-hidden="true"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find your arena" aria-label="Search Game events"/></label></div>
          <p className="gm-results" aria-live="polite">{levels.length} / 16 EVENTS</p>
        </div>

        {([{ category: 'technical', id: 'technical-events', title: 'HACK THE LIMITS.', label: 'TECHNICAL EVENTS', desc: 'Outthink. Outbuild. Outplay. Where your next big idea becomes the winning move.' }, { category: 'non-technical', id: 'non-technical-events', title: 'STEAL THE SPOTLIGHT.', label: 'NON-TECHNICAL EVENTS', desc: 'Big plays. Bold creativity. Bring your squad, your style, and your competitive streak.' }] as const).map(group => {
          const groupEvents = levels.filter(event => event.category === group.category);
          if (groupEvents.length === 0) return null;
          return <section key={group.id} id={group.id} className={`gm-event-world ${group.category === 'technical' ? 'gm-world-tech' : 'gm-world-fun'}`} aria-label={group.label}>
            <div className="gm-world-heading"><div><p className="gm-chip">{group.label}</p><h2 className="gm-pixel gm-h2">{group.title}</h2><p>{group.desc}</p></div><span className="gm-world-count">{String(groupEvents.length).padStart(2,'0')}<small>ARENAS</small></span></div>
        <div className="gm-levels">
          {groupEvents.map((e) => {
            return (
              <Button variant="game" key={e.id} className={`gm-card ${e.category === 'technical' ? 'is-tech' : 'is-fun'}`} onPointerMove={event => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--rx', `${-(event.clientY - rect.top - rect.height / 2) / 35}deg`); event.currentTarget.style.setProperty('--ry', `${(event.clientX - rect.left - rect.width / 2) / 35}deg`); }} onPointerLeave={event => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg'); }} aria-label={`View ${e.title} event details`} onClick={() => onOpenEvent(e.id)}>
                <span className="gm-card-lvl gm-pixel">LVL {e.number}</span>
                <span className="gm-card-mode">{e.category === 'technical' ? 'TECH' : 'FUN'}</span>
                <GameArtwork id={e.id} iconName={e.iconName} />
                <div className="gm-card-copy"><h3 className="gm-card-title">{e.title}</h3>
                <p className="gm-card-desc">{e.shortDesc}</p>
                <div className="gm-card-meta">
                  <span><Users className="w-3.5 h-3.5" /> {e.teamSize}</span>
                </div>
                <span className="gm-card-play">ENTER ARENA <ArrowUpRight /></span></div>
              </Button>
            );
          })}
        </div>
          </section>;
        })}
        {levels.length === 0 && <div className="gm-empty"><p>No arenas found.</p><Button variant="game" onClick={() => { setSearch(''); setMode('all'); }}>Reset filters</Button></div>}
      </section>

      {!track && <>
      <section id="brochure" className="gm-section gm-brochure-section"><div><p className="gm-chip">THE OFFICIAL DROP</p><h2 className="gm-pixel gm-h2">THE WHOLE<br/>LINEUP.</h2><p>Eight technical. Eight non-technical.<br/>Your next challenge is on the poster.</p><Button variant="game" className="gm-brochure-link" onClick={() => setPosterOpen(true)}>Open official brochure <ArrowUpRight/></Button><Button variant="game" className="gm-brochure-link" onClick={() => downloadBrochure().catch(() => window.open(posterImg, '_blank', 'noopener'))}>Download brochure ↓</Button></div></section>

      {/* HOW TO PLAY */}
      <section className="gm-section">
        <div className="gm-sec-head"><h2 className="gm-pixel gm-h2">HOW TO PLAY</h2></div>
        <ol className="gm-steps">
          {[
            [Crosshair, 'PICK A LEVEL', 'Browse the 16 events and open the one you want to conquer.'],
            [Users, 'BUILD YOUR PARTY', 'Go solo or squad up — check each level for team size.'],
            [Swords, 'REGISTER', 'Lock in your spot before the countdown hits zero.'],
            [Trophy, 'CLAIM THE LOOT', 'Top players win prizes and bragging rights.'],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Crosshair;
            return (
              <li key={t as string} className="gm-step" style={{ ['--d' as string]: `${i * 90}ms` }}>
                <span className="gm-step-n gm-pixel">0{i + 1}</span>
                <I className="w-6 h-6" />
                <b>{t as string}</b>
                <p>{d as string}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* BOSS CTA */}
      <section className="gm-section">
        <div className="gm-boss">
          <p className="gm-chip">⚠ FINAL STAGE</p>
          <h2 className="gm-pixel gm-h2">READY, PLAYER ONE?</h2>
          <p>The arena opens on 26 October 2026. Save your slot now.</p>
          <Button variant="game" className="gm-btn gm-btn-primary" onClick={onRegister}><Play className="w-4 h-4" /> JOIN THE GAME</Button>
        </div>
      </section>
      </>}
      <Dialog open={posterOpen} onOpenChange={setPosterOpen}><DialogContent className="poster-dialog gm-poster-dialog"><DialogTitle>Talent Hunt 2K26 · Official brochure</DialogTitle><DialogDescription className="sr-only">Official event poster with the complete festival lineup.</DialogDescription><img src={posterImg} alt="Official Talent Hunt 2K26 poster" className="official-poster"/></DialogContent></Dialog>
    </div>
  );
}
