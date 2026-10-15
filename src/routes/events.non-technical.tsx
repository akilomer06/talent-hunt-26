import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';
export const Route = createFileRoute('/events/non-technical')({
 head: () => ({ meta: [{ title: 'Steal the Spotlight — Non-Technical Events | Talent Hunt 2K26' }, { name: 'description', content: 'Steal the Spotlight — Non-Technical Events at Talent Hunt 2K26. Explore eight competitive arenas at Crescent Institute.' }, { property: 'og:title', content: 'Steal the Spotlight — Non-Technical Events | Talent Hunt 2K26' }, { property: 'og:description', content: 'Steal the Spotlight — Non-Technical Events at Talent Hunt 2K26. Explore eight competitive arenas at Crescent Institute.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <App view="non-technical"/>,
});
