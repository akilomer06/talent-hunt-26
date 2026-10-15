import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [rno, setRno] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-modal-title"
    >
      <div
        className="relative w-full max-w-xl bg-paper-soft brutal-border-thick brutal-shadow-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-ink mb-6">
          <div>
            <span className="bg-vivid-orange text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
              REGISTRATION PROTOCOL
            </span>
            <h3 id="reg-modal-title" className="font-display font-black text-2xl sm:text-3xl text-ink mt-1">
              Join Talent Hunt 2K26
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-paper hover:bg-ink hover:text-white text-ink brutal-border brutal-shadow transition-colors"
            aria-label="Close Registration Info"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Advisory */}
        <div className="bg-paper p-4 brutal-border mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-vivid-orange shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-sans text-ink leading-relaxed">
              <strong className="block font-space uppercase text-ink mb-1">
                Classroom Registration Active:
              </strong>
              In accordance with SCIMS department directives, official entry rosters are collected directly through Section Student Coordinators and faculty mentors to prevent slot duplicates in squad events (BGMI, Valorant, Bid Wars).
            </div>
          </div>
        </div>

        {/* Steps to Register */}
        <div className="mb-6 space-y-3">
          <h4 className="font-space text-xs font-bold text-ink-muted uppercase tracking-wider">
            3 Steps to Register:
          </h4>

          <div className="flex items-start gap-3 bg-paper p-3 brutal-border">
            <span className="w-6 h-6 rounded-none bg-ink text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div className="text-xs sm:text-sm font-sans text-ink">
              <strong>Select your competitions:</strong> Review the 16 technical and non-technical events above and verify team size limits.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-paper p-3 brutal-border">
            <span className="w-6 h-6 rounded-none bg-electric-blue text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div className="text-xs sm:text-sm font-sans text-ink">
              <strong>Contact your Section Lead:</strong> Check the Coordinators section below for your assigned student coordinator (CSE A, B, C, D, AIDS, M.Tech).
            </div>
          </div>

          <div className="flex items-start gap-3 bg-paper p-3 brutal-border">
            <span className="w-6 h-6 rounded-none bg-vivid-orange text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div className="text-xs sm:text-sm font-sans text-ink">
              <strong>Report at Auditorium:</strong> On Monday, 26 October 2026 at 08:30 AM IST with your Crescent Student ID card.
            </div>
          </div>
        </div>

        {/* Quick Notification Signup */}
        <div className="pt-4 border-t-2 border-ink">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <h4 className="font-space text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-vivid-orange" />
                <span>Get Instant SMS / Email Link When Direct Portal Opens:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={rno}
                  onChange={(e) => setRno(e.target.value)}
                  placeholder="RRN / Student ID"
                  className="bg-paper p-2.5 brutal-border text-xs font-sans text-ink focus:outline-none focus:ring-2 focus:ring-vivid-orange"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Crescent / Personal Email"
                  className="bg-paper p-2.5 brutal-border text-xs font-sans text-ink focus:outline-none focus:ring-2 focus:ring-vivid-orange"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-vivid-orange text-white py-3 font-space text-xs sm:text-sm font-bold uppercase tracking-wider brutal-border transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Notify Me When Online Form Deploys</span>
              </button>
            </form>
          ) : (
            <div className="bg-green-50 brutal-border border-green-700 p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-700 mx-auto mb-2" />
              <h4 className="font-display font-bold text-green-900 text-sm">
                Roster Notification Registered!
              </h4>
              <p className="font-sans text-xs text-green-800 mt-1">
                You will be notified at {email} as soon as the centralized link opens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
