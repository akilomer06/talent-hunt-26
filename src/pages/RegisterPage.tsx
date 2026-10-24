import { ArrowLeft } from 'lucide-react';
import { EventVenueDirectory } from '../components/EventVenueDirectory';
import { ON_SPOT_REGISTRATION_NOTICE } from '../../shared/registrationRules';

interface RegisterPageProps {
  initialEventId?: string;
  onBack: () => void;
}

export const RegisterPage = ({ onBack }: RegisterPageProps) => (
  <div className="register-reading reg-page">
    <div className="reg-wrap">
      <button onClick={onBack} className="reg-back"><ArrowLeft className="w-4 h-4" /> Back</button>
      <header className="reg-head">
        <p className="reg-kicker">Talent Hunt 2K26 · 26 October 2026</p>
        <h1>Online registration is closed</h1>
        <p className="reg-lede">Online registration has closed for all 16 events.</p>
      </header>
      <section className="reg-card mb-8" aria-labelledby="spot-registration-title">
        <h2 id="spot-registration-title" className="font-display text-2xl font-bold mb-3">On-the-spot registration</h2>
        <p>{ON_SPOT_REGISTRATION_NOTICE}</p>
        <p className="mt-3">Visit the relevant event venue on campus on 26 October 2026 and speak to the event coordinators. Bring your Crescent Student ID.</p>
      </section>
      <aside className="reg-support" aria-label="Registration help">
        <p>Already registered? Your existing registration remains valid.</p>
        <p>Need help? Contact <a href="tel:+917338985189">Vijay Hari · +91 733 898 5189</a>.</p>
      </aside>
      <EventVenueDirectory />
    </div>
  </div>
);
