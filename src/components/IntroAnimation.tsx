import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import logo from '../assets/talent-hunt-logo-white.png';

/** Full-screen logo intro, shown once per browser session. */
export function IntroAnimation() {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'exit'>('hidden');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('th26_intro')) return;
    sessionStorage.setItem('th26_intro', '1');
    setPhase('show');
    const t1 = setTimeout(() => setPhase('exit'), 2300);
    const t2 = setTimeout(() => setPhase('hidden'), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'hidden') return null;
  const word = 'TALENT HUNT';

  return (
    <div
      className={`site-intro fixed inset-0 z-[100] flex flex-col items-center justify-center ${phase === 'exit' ? 'intro-exit' : ''}`}
      role="dialog" aria-label="Talent Hunt introduction"
    >
      <Button variant="festivalGhost"
        onClick={() => setPhase('exit')}
        className="intro-skip absolute top-6 right-6 text-xs font-space uppercase tracking-widest"
      >
        Skip
      </Button>
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
        <span className="intro-ring absolute inset-0 rounded-full border border-vivid-orange/60" />
        <span className="intro-ring absolute inset-0 rounded-full border border-electric-blue/60" style={{ animationDelay: '0.6s' }} />
        <img src={logo} alt="" className="intro-logo relative w-full h-full object-contain rounded-[28px]" />
      </div>
      <div className="mt-10 overflow-hidden font-display font-black text-3xl sm:text-6xl tracking-tight">
        {word.split('').map((c, i) => (
          <span key={i} className="intro-letter" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
            {c === ' ' ? '\u00A0' : c}
          </span>
        ))}
      </div>
      <p className="overflow-hidden mt-2 font-display font-black text-2xl sm:text-3xl text-vivid-orange">
        <span className="intro-letter" style={{ animationDelay: '1.1s' }}>2K26</span>
      </p>
      <div className="mt-8 w-40 h-[2px] bg-white/15 overflow-hidden rounded-full">
        <div className="intro-bar h-full bg-gradient-to-r from-electric-blue to-vivid-orange" />
      </div>
    </div>
  );
}
