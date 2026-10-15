import { ArrowDownRight } from 'lucide-react';
export function AboutSection() {
  return <section id="about" className="festival-about">
    <div className="section-inner about-layout" data-reveal>
      <div><p className="section-kicker">NOT JUST ANOTHER SYMPOSIUM</p><h2>Logic meets passion.<br /><span>Talent takes over.</span></h2></div>
      <div className="about-summary"><ArrowDownRight /><p>Organised by the Department of Computer Science & Engineering at Crescent Institute, Talent Hunt brings our students together across code, creativity and competition.</p><div className="about-facts"><div><strong>16</strong><span>Competitive arenas</span></div><div><strong>01</strong><span>Department. All CSE.</span></div></div></div>
    </div>
  </section>;
}
