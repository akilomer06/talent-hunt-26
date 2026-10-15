import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FaqSection } from './components/FaqSection';
import { IntroAnimation } from './components/IntroAnimation';
import { useReveal } from './components/useReveal';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { EventDirectory } from './components/EventDirectory';
import { VenueSection } from './components/VenueSection';
import { RegistrationSection } from './components/RegistrationSection';
import { Footer } from './components/Footer';
import { EventDetailPage } from './pages/EventDetailPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { RegistrationModal } from './components/RegistrationModal';
import { GameInfoPage, type InfoPage } from './components/game/GameInfoPage';
import { GameHome } from './components/game/GameHome';
import { EVENTS } from './data/eventsData';

type Theme = 'paper' | 'dark' | 'game';
type View = 'home' | 'event-detail' | 'register' | 'faqs' | InfoPage | 'technical' | 'non-technical' | 'admin' | 'adminregistration';

export function App({ view = 'home', eventId = 'code-break' }: { view?: View; eventId?: string } = {}) {
  const navigate = useNavigate();
  const currentView = view;
  const selectedEventId = eventId;
  const setCurrentView = (v: View) => {
    if (v === 'home') navigate({ to: '/' });
    else if (v === 'register') navigate({ to: '/register', search: { event: selectedEventId } });
    else if (v === 'faqs') navigate({ to: '/faqs' });
    else if (v === 'admin') navigate({ to: '/admin' });
  };
  const setSelectedEventId = (id: string) => navigate({ to: '/events/$eventId', params: { eventId: id } });
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Theme state: paper -> dark -> game
  const [theme, setTheme] = useState<Theme>('paper');
  useReveal(view + eventId + theme);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const darkMode = theme !== 'paper';

  useEffect(() => {
    const t = localStorage.getItem('th26_theme');
    setTheme(t === 'dark' || t === 'game' ? t : 'paper');
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    for (const el of [document.documentElement, document.body]) {
      el.classList.toggle('dark', theme !== 'paper');
      el.classList.toggle('game', theme === 'game');
    }
    localStorage.setItem('th26_theme', theme);
  }, [theme, themeLoaded]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'paper' ? 'dark' : prev === 'dark' ? 'game' : 'paper'));
  };

  const handleOpenEventDetails = (id: string) => setSelectedEventId(id);

  const handleNavigateRegister = (preselectedEventId?: string) => {
    preselectedEventId ? navigate({ to: '/register', search: { event: preselectedEventId } }) : navigate({ to: '/register' });
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreEvents = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const eventsElem = document.getElementById('events');
        if (eventsElem) eventsElem.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      const eventsElem = document.getElementById('events');
      if (eventsElem) eventsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentEvent = EVENTS.find((e) => e.id === selectedEventId);
  const activePageName =
    currentView === 'event-detail'
      ? currentEvent?.title
      : currentView === 'register'
      ? 'Registration'
      : currentView === 'faqs'
      ? 'FAQs'
      : currentView === 'admin'
      ? 'Admin Portal'
      : currentView === 'home' ? undefined : currentView.replace('-', ' ');

  if (currentView === 'admin' || currentView === 'adminregistration') {
    return <AdminPage registrationOnly={currentView === 'adminregistration'} onBack={handleNavigateHome} />;
  }

  return (
    <div className={`${theme !== 'game' ? 'reading-theme' : ''} min-h-screen bg-paper text-ink flex flex-col selection:bg-vivid-orange selection:text-white transition-colors duration-200`}>
      <IntroAnimation />
      {/* Persistent Navigation Header with Theme Toggle & Active Page Name */}
      <Header
        onNavigateHome={handleNavigateHome}
        onNavigateRegister={() => handleNavigateRegister()}
        darkMode={darkMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentPageName={activePageName}
      />

      {/* Main View Switching */}
      <main id="main" className="flex-1">
        {currentView === 'home' && theme === 'game' && (
          <GameHome onRegister={() => handleNavigateRegister()} onOpenEvent={handleOpenEventDetails} />
        )}
        {currentView === 'home' && theme !== 'game' && (
          <>
            <Hero
              onRegisterClick={() => handleNavigateRegister()}
              onExploreClick={handleExploreEvents}
            />
            <AboutSection />
            <EventDirectory onOpenEventDetails={handleOpenEventDetails} />
            <VenueSection />
            <RegistrationSection
              onOpenModal={() => setIsRegModalOpen(true)}
              onRegister={() => handleNavigateRegister()}
            />
            <FaqSection compact onSeeAll={() => setCurrentView('faqs')} />
          </>
        )}

        {(currentView === 'technical' || currentView === 'non-technical') && (theme === 'game' ? <GameHome track={currentView} onRegister={() => handleNavigateRegister()} onOpenEvent={handleOpenEventDetails}/> : <EventDirectory track={currentView} onOpenEventDetails={handleOpenEventDetails}/>) }
        {(['schedule','coordinators','about','venue','contact'] as string[]).includes(currentView) && <GameInfoPage page={currentView as InfoPage} game={theme === 'game'}/> }

        {currentView === 'faqs' && <FaqSection />}

        {currentView === 'event-detail' && (
          <EventDetailPage
            eventId={selectedEventId}
            onBack={() => {
              navigate({ to: '/' }).then(() => {
                setTimeout(() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }), 50);
              });
            }}
            onNavigateEvent={(id) => setSelectedEventId(id)}
            onRegisterEvent={(id) => handleNavigateRegister(id)}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            initialEventId={selectedEventId}
            onBack={handleNavigateHome}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <Footer />

      {/* Registration Protocol Modal (Fallback advisory) */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
      />
    </div>
  );
}

export default App;
