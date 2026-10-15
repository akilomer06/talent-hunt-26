import { Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { Menu, ArrowUpRight, Sun, Moon, Gamepad2 } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import logoImg from '../assets/talent-hunt-logo.png';
import logoSolid from '../assets/talent-hunt-logo-white.png';

const menu = [
  {to:'/',label:'Home'}, {to:'/events/technical',label:'Technical Events'}, {to:'/events/non-technical',label:'Non-Technical Events'}, {to:'/schedule',label:'Schedule'}, {to:'/coordinators',label:'Coordinators'}, {to:'/about',label:'About'}, {to:'/venue',label:'Venue'}, {to:'/faqs',label:'FAQs'}, {to:'/contact',label:'Contact'},
] as const;
interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
  darkMode: boolean;
  theme?: 'paper' | 'dark' | 'game';
  onToggleTheme: () => void;
  currentPageName?: string | undefined;
}
export function Header({ theme = 'paper', onToggleTheme }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: s => s.location.pathname });
  const onRegister = path === '/register';
  const next = theme === 'paper' ? 'Dark' : theme === 'dark' ? 'Game' : 'Paper';
  const ThemeIcon = theme === 'paper' ? Moon : theme === 'dark' ? Gamepad2 : Sun;
  return <header className="site-header">
    <a href="#main" className="skip-link">Skip to content</a>
    <div className="site-header-inner">
      <Link to="/" className="site-brand" aria-label="Talent Hunt 2K26 home">
        <img src={logoImg} alt="" aria-hidden="true" className="logo-ink"/>
        <img src={logoSolid} alt="" aria-hidden="true" className="logo-solid"/>
        <span className="brand-divider" aria-hidden="true"/>
        <span className="brand-text" aria-hidden="true"><span className="brand-line">TALENT</span><span className="brand-line brand-line-2">HUNT <b>2K26</b></span></span>
      </Link>
      <nav className="inline-nav" aria-label="Main navigation">
        {menu.map(item => <Link key={item.to} to={item.to} activeOptions={{exact:true}} activeProps={{className:'is-active','aria-current':'page'}}>{item.label}</Link>)}
      </nav>
      <div className="site-header-actions">
        <Button variant="festivalGhost" size="icon" onClick={onToggleTheme} aria-label={`Switch theme (now ${theme}, next ${next})`} title={`Switch to ${next} theme`}><ThemeIcon/></Button>
        {onRegister
          ? <span className="header-register is-current" aria-current="page">Register</span>
          : <Button asChild variant="festival" className="header-register"><Link to="/register">Register now <ArrowUpRight/></Link></Button>}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button variant="festivalGhost" className="header-menu" aria-label="Open menu"><span>Menu</span><Menu/></Button></SheetTrigger>
          <SheetContent className="navigation-sheet">
            <p className="section-kicker">Talent Hunt 2K26</p>
            <SheetTitle className="navigation-title">Find your moment</SheetTitle>
            <SheetDescription className="navigation-description">Code. Create. Compete.</SheetDescription>
            <nav aria-label="Expanded navigation">{menu.map((item,index)=><Link key={item.to} to={item.to} onClick={()=>setOpen(false)} activeOptions={{exact:true}} activeProps={{className:'is-active'}}><span className="menu-index">{String(index+1).padStart(2,'0')}</span><span>{item.label}</span><ArrowUpRight/></Link>)}<Link to="/register" onClick={()=>setOpen(false)}><span className="menu-index">10</span><span>Register</span><ArrowUpRight/></Link></nav>
            <p className="navigation-eligibility">Open to CSE and AI&amp;DS students (B.Tech and M.Tech)</p>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>;
}
