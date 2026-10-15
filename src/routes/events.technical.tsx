import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';
export const Route = createFileRoute('/events/technical')({
 head: () => ({ meta: [{ title: 'Hack the Limits — Technical Events | Talent Hunt 2K26' }, { name: 'description', content: 'Hack the Limits — Technical Events at Talent Hunt 2K26. Explore eight competitive arenas at Crescent Institute.' }, { property: 'og:title', content: 'Hack the Limits — Technical Events | Talent Hunt 2K26' }, { property: 'og:description', content: 'Hack the Limits — Technical Events at Talent Hunt 2K26. Explore eight competitive arenas at Crescent Institute.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <App view="technical"/>,
});
