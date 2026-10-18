import crescentLogo from '../assets/logo-crescent.png';

/** Preserve the coloured emblem while making the lettering white on dark surfaces. */
export function CrescentWordmark({ className = '' }: { className?: string }) {
  return <span className={`crescent-wordmark ${className}`}>
    <img src={crescentLogo} alt="B.S. Abdur Rahman Crescent Institute of Science and Technology" className="crescent-emblem" />
    <img src={crescentLogo} alt="" aria-hidden="true" className="crescent-white-text" />
  </span>;
}
