import React, { useState } from 'react';
import { Sparkles, AlertCircle, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegistrationSectionProps {
  onOpenModal: () => void;
  onRegister: () => void;
}

export const RegistrationSection: React.FC<RegistrationSectionProps> = ({ onOpenModal, onRegister }) => {
  const [testSection, setTestSection] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<string | null>(null);

  // Check if official external URL is configured via environment
  const configuredUrl = import.meta.env['VITE_REGISTRATION_URL'];

  const handleRegisterAction = () => {
    if (configuredUrl) {
      window.open(configuredUrl, '_blank', 'noopener,noreferrer');
    } else {
      onRegister();
    }
  };

  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSection.trim()) return;

    const query = testSection.toLowerCase();
    const isEligible =
      query.includes('cse') ||
      query.includes('aids') ||
      query.includes('cs') ||
      query.includes('iot') ||
      query.includes('mtech') ||
      query.includes('computer');

    if (isEligible) {
      setEligibilityResult('eligible');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } else {
      setEligibilityResult('ineligible');
    }
  };

  return (
    <section id="register" className="py-12 sm:py-16 border-b-2 border-ink bg-paper-soft relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-paper brutal-border-thick brutal-shadow-lg p-6 sm:p-10 relative overflow-hidden">
          {/* Diagonal Corner Ribbons */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-vivid-orange/10 rounded-bl-full pointer-events-none" />

          <div className="max-w-3xl">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-paper-soft brutal-border text-[11px] font-mono font-bold text-ink uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-vivid-orange" />
              <span>REGISTRATION STATUS · DEPARTMENT EXCLUSIVE</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-tight mb-4">
              Ready to Compete in
              <span className="text-vivid-orange block">Talent Hunt 2K26?</span>
            </h2>

            <p className="font-sans text-sm sm:text-base text-ink-muted leading-relaxed font-medium mb-6">
              Participation is restricted exclusively to students of the Department of Computer Science & Engineering, Crescent Institute. Register early to secure slots in high-demand team arenas like Bid Wars, Valorant, BGMI, and Code Canvas.
            </p>

            {/* Registration Action Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <button
                onClick={handleRegisterAction}
                className="flex items-center justify-center gap-2 bg-vivid-orange hover:bg-vivid-orange-hover text-black font-extrabold px-6 py-3 font-space text-sm sm:text-base uppercase tracking-wider brutal-border brutal-shadow hover:-translate-y-0.5 transition-all"
                aria-label="Proceed to Registration"
              >
                <Sparkles className="w-4 h-4" />
                <span>Register Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenModal}
                className="flex items-center justify-center gap-2 bg-paper-soft hover:bg-ink hover:text-white text-ink px-5 py-3 font-space text-xs sm:text-sm font-bold uppercase tracking-wider brutal-border transition-colors"
              >
                <span>View Guidelines & Deadlines</span>
              </button>
            </div>

            {/* Operational Transparency Callout */}
            <div className="bg-paper-soft brutal-border p-3.5 mb-6 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-vivid-orange shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-sans text-ink leading-relaxed">
                <strong>Department Registration Protocol:</strong>
                {configuredUrl ? (
                  <span> Direct external registration form connected.</span>
                ) : (
                  <span>
                    {' '}Official registration forms are being distributed directly through class coordinators and CSE Google Classrooms. Contact your Section Student Coordinator below to lock your entry.
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Eligibility Quick Checker */}
            <div className="pt-5 border-t border-ink/25">
              <h4 className="font-space text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2.5">
                Quick Eligibility Verification (Check by Degree or Section)
              </h4>
              <form onSubmit={handleCheckEligibility} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={testSection}
                  onChange={(e) => {
                    setTestSection(e.target.value);
                    setEligibilityResult(null);
                  }}
                  placeholder="e.g. CSE-A, AIDS, CSE IoT, M.Tech"
                  className="bg-paper-soft px-3 py-1.5 brutal-border text-xs sm:text-sm font-sans text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-vivid-orange min-w-[220px]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-ink text-paper font-space text-xs font-bold uppercase tracking-wider brutal-border"
                >
                  Verify
                </button>
              </form>

              {eligibilityResult === 'eligible' && (
                <div className="mt-2.5 flex items-center gap-2 text-xs font-mono font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 p-2 brutal-border border-green-700 dark:border-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eligible! Department of CSE / Allied Programme confirmed.</span>
                </div>
              )}

              {eligibilityResult === 'ineligible' && (
                <div className="mt-2.5 flex items-center gap-2 text-xs font-mono font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2 brutal-border border-red-700 dark:border-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Note: Talent Hunt 2K26 is exclusively open to CSE and allied SCIMS students.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
