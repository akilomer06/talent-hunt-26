import crescentLightLogo from '../assets/logo-crescent.png';
import { CrescentWordmark } from './CrescentWordmark';

export function InstitutionalBanner({ animate = false, className = '' }: { animate?: boolean; className?: string }) {
  return <div className={`hero-institutional ${className}`} data-hero-enter={animate ? '' : undefined}>
    <div className="hero-institutional-inner">
      <p className="institutional-text">
        <span className="institutional-school">School of Computer Information and Mathematical Sciences</span>
        <span className="institutional-dept">Department of Computer Science and Engineering</span>
      </p>
      <img src={crescentLightLogo} alt="B.S. Abdur Rahman Crescent Institute of Science and Technology" className="institutional-logo crescent-on-light" />
      <CrescentWordmark className="institutional-logo crescent-on-dark" />
    </div>
  </div>;
}
