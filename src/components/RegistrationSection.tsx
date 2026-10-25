import { ArrowUpRight } from 'lucide-react';
import { ON_SPOT_REGISTRATION_NOTICE, REGISTRATION_STATUS_MESSAGE } from '../../shared/registrationRules';

interface RegistrationSectionProps {
  onOpenModal: () => void;
  onRegister: () => void;
}

export const RegistrationSection = ({ onRegister }: RegistrationSectionProps) => (
  <section id="register" className="py-12 sm:py-16 border-b-2 border-ink bg-paper-soft text-ink">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="font-space text-xs font-bold uppercase tracking-wider mb-3">Registration update</p>
      <h2 className="font-display font-black text-3xl sm:text-4xl mb-4">Online registration is closed</h2>
      <p className="max-w-3xl text-ink-muted leading-relaxed mb-6">{REGISTRATION_STATUS_MESSAGE} {ON_SPOT_REGISTRATION_NOTICE}</p>
      <button onClick={onRegister} className="inline-flex items-center gap-2 font-bold underline underline-offset-4">View venues and registration information <ArrowUpRight className="w-4 h-4" /></button>
    </div>
  </section>
);
