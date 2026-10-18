import crescentDarkLogo from '../assets/logo-crescent-dark.png';

/** The complete light-theme logo recreated with white lettering for dark surfaces. */
export function CrescentWordmark({ className = '' }: { className?: string }) {
  return <img src={crescentDarkLogo} alt="B.S. Abdur Rahman Crescent Institute of Science and Technology" className={`crescent-wordmark ${className}`} />;
}
