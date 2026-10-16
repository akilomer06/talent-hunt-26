import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Calendar, ShieldCheck, Download } from 'lucide-react';
import gsap from 'gsap';
import { Countdown } from './Countdown';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { brochureUrl as posterImg, downloadBrochure } from '../lib/brochure';
import crescentLightLogo from '../assets/logo-crescent-light.png';
import { CrescentWordmark } from './CrescentWordmark';

interface HeroProps { onRegisterClick: () => void; onExploreClick: () => void; }

export function Hero({ onRegisterClick, onExploreClick }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [posterOpen, setPosterOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-enter]', { y: 24, opacity: 0, duration: .85, stagger: .12, ease: 'power3.out', delay: .2 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return <>
    <section id="hero" ref={heroRef} className="festival-hero stage-hero marked-hero reveal-skip">
      <div className="hero-institutional" data-hero-enter>
        <div className="hero-institutional-inner">
          <p className="institutional-text">
            <span className="institutional-school">School of Computer Information and Mathematical Sciences</span>
            <span className="institutional-dept">Department of Computer Science and Engineering</span>
          </p>
          <img src={crescentLightLogo} alt="B.S. Abdur Rahman Crescent Institute of Science and Technology" className="institutional-logo crescent-on-light"/>
          <CrescentWordmark className="institutional-logo crescent-on-dark" />
        </div>
      </div>
      <div className="stage-inner">
        <div className="stage-copy">
          <p className="stage-kicker" data-hero-enter>CSE Department presents</p>
          <h1 className="stage-title" aria-label="Talent Hunt 2K26" data-hero-enter>
            <span aria-hidden="true" className="talent-word">TALENT</span>
            <span aria-hidden="true" className="hunt-word">HUNT</span>
            <span aria-hidden="true" className="stage-year">2K26</span>
          </h1>
          <div className="stage-foot" data-hero-enter>
            <p className="stage-tagline">A stage for skills,<br/>ideas & fearless <em>creativity.</em></p>
            <div className="hero-actions">
              <Button variant="festival" size="lg" className="stage-explore" onClick={onExploreClick}>Explore events <ArrowRight /></Button>
              <Button variant="festivalOutline" size="lg" className="stage-register" onClick={onRegisterClick}>Register now</Button>
            </div>
          </div>
          <p className="stage-eligibility" data-hero-enter><ShieldCheck/> Open to CSE and AI&DS students (B.Tech and M.Tech)</p>
          <p className="stage-institute-name" data-hero-enter>B.S. Abdur Rahman Crescent Institute of Science & Technology</p>
        </div>
        <figure className="stage-brochure" data-hero-enter>
          <Button variant="festivalGhost" onClick={() => setPosterOpen(true)} className="brochure-preview" aria-label="Open official brochure"><img src={posterImg} alt="Official Talent Hunt 2K26 brochure" /></Button>
          <figcaption className="stage-brochure-cap"><span>Official brochure · 16 events</span><button type="button" onClick={() => downloadBrochure().catch(() => window.open(posterImg, '_blank', 'noopener'))}><Download /> Download</button></figcaption>
        </figure>
      </div>
      <div className="stage-strip" data-hero-enter>
        <div className="stage-date"><strong aria-hidden="true">26</strong><p><span>October 2026</span><span>Monday</span></p></div>
        <div className="stage-count"><p>Your moment is getting closer</p><Countdown /><p className="stage-small"><Calendar/> 26 October · 9:00 AM IST</p></div>
        <div className="stage-venue"><ArrowUpRight/><p><strong>Auditorium</strong><span>B.S. Abdur Rahman Crescent</span></p></div>
      </div>
    </section>
    <Dialog open={posterOpen} onOpenChange={setPosterOpen}><DialogContent className="poster-dialog"><DialogTitle className="font-space text-ink">Talent Hunt 2K26 · Official poster</DialogTitle><DialogDescription className="sr-only">Official festival brochure with the complete lineup.</DialogDescription><img src={posterImg} alt="Official Talent Hunt 2K26 poster" className="official-poster" /></DialogContent></Dialog>
  </>;
}
