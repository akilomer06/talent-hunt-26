import { Link } from '@tanstack/react-router';
import { ArrowUp, ArrowUpRight, Camera, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import logoImg from '../assets/talent-hunt-logo.png';
import logoSolid from '../assets/talent-hunt-logo-white.png';
import { CrescentWordmark } from './CrescentWordmark';
import acmLogo from '../assets/logo-acm.png';
import cseaLogo from '../assets/logo-csea.png';

export function Footer() {
  return <footer className="festival-footer" id="contact">
    <div className="section-inner">
      <div className="footer-main">
        <div className="footer-identity"><img src={logoImg} alt="Talent Hunt 2K26 emblem" className="logo-ink"/><img src={logoSolid} alt="Talent Hunt 2K26 emblem" className="logo-solid"/><p className="footer-kicker">26 OCTOBER 2026 · CRESCENT</p><h2>TALENT HUNT<span>2K26.</span></h2><p>Code. Create. Compete.<br/>Sixteen arenas. Your moment to shine.</p></div>
        <nav className="footer-nav" aria-label="Footer navigation"><p className="footer-kicker">CHOOSE YOUR NEXT MOVE</p><Link to="/">Home <ArrowUpRight/></Link><Link to="/events/technical">Technical events <ArrowUpRight/></Link><Link to="/events/non-technical">Non-technical events <ArrowUpRight/></Link><Link to="/register" >Registration info <ArrowUpRight/></Link><Link to="/faqs">FAQs <ArrowUpRight/></Link></nav>
        <div className="footer-connect"><p className="footer-kicker">FIND US</p><a href="https://www.instagram.com/bsacistcse/" target="_blank" rel="noopener noreferrer" aria-label="Department of CSE on Instagram (opens in a new tab)"><Camera aria-hidden="true"/>@bsacistcse <ArrowUpRight aria-hidden="true"/></a><p><MapPin/>Auditorium · Crescent Institute<br/>GST Road, Vandalur, Chennai</p><p className="footer-eligibility">Department of CSE · SCIMS<br/>CSE students only</p></div>
      </div>
      <div className="footer-logo-row" aria-label="Institutional partners"><CrescentWordmark className="footer-crescent"/><img src={acmLogo} alt="ACM Student Chapter"/><img src={cseaLogo} alt="CSEA"/></div>
      <div className="footer-bottom">
        <p>
          © 2026 Talent Hunt · Department of CSE, Crescent Institute. ·{' '}
          <Link to="/admin" className="hover:text-vivid-orange transition-colors underline-offset-2 hover:underline">
            Admin Portal
          </Link>
        </p>
        <Button variant="festivalGhost" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Back to top of page">Back to top <ArrowUp/></Button>
      </div>
    </div>
  </footer>;
}
