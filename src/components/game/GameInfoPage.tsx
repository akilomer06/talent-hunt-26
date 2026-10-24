import { Link } from '@tanstack/react-router';
import { MapPin, CalendarDays, ArrowUpRight, Camera } from 'lucide-react';
import { VenueSection } from '../VenueSection';
import { CoordinatorsSection } from '../CoordinatorsSection';
import { GameCursor } from './GameCursor';

export type InfoPage = 'schedule' | 'coordinators' | 'about' | 'venue' | 'contact';
const titles: Record<InfoPage,string> = {schedule:'THE GAME PLAN.',coordinators:'MEET THE CREW.',about:'THIS IS TALENT HUNT.',venue:'FIND THE ARENA.',contact:'GET IN TOUCH.'};
export function GameInfoPage({page, game = false}: {page:InfoPage; game?: boolean}) {
 return <div className="info-page">{game && <GameCursor/>}<div className="section-inner info-intro"><p className="section-kicker">TALENT HUNT 2K26 / {page.toUpperCase()}</p><h1 className={page === 'coordinators' ? 'crew-title' : undefined}>{titles[page]}</h1></div>
 {page === 'venue' && <VenueSection/>}
 {page === 'coordinators' && <CoordinatorsSection/>}
 {page === 'schedule' && <div className="section-inner info-content"><p className="info-date"><CalendarDays/>26 October 2026 · Monday</p><h2>The countdown is on.</h2><p>The festival starts at 9:00 AM IST at Crescent Institute. Individual event timings and the final running order have not been announced.</p><Link to="/events/technical">Explore technical events <ArrowUpRight/></Link><Link to="/events/non-technical">Explore non-technical events <ArrowUpRight/></Link></div>}
 {page === 'about' && <div className="section-inner info-content"><h2>Logic meets passion. Talent takes over.</h2><p>The flagship intra-departmental battleground for the Department of Computer Science & Engineering, B.S. Abdur Rahman Crescent Institute of Science & Technology.</p><p>Sixteen curated arenas spanning coding, AI, cybersecurity, creative performance, sustainable fashion, and esports. Eight technical. Eight non-technical. All CSE.</p><Link to="/register" >Registration information <ArrowUpRight/></Link></div>}
 {page === 'contact' && <div className="section-inner info-content"><h2>Let’s connect.</h2><p>Follow the Department of CSE on Instagram for updates.</p><a href="https://www.instagram.com/bsacistcse/" target="_blank" rel="noopener noreferrer" aria-label="Department of CSE on Instagram (opens in a new tab)"><Camera aria-hidden="true"/>@bsacistcse <ArrowUpRight aria-hidden="true"/></a><p>For event questions, find your section coordinator.</p><Link to="/coordinators">Meet the coordinators <ArrowUpRight/></Link><p className="info-date"><MapPin/>Crescent Institute · GST Road, Vandalur, Chennai</p></div>}
 </div>;
}
