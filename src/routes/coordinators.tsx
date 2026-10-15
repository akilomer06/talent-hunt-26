import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';
export const Route = createFileRoute('/coordinators')({
 head: () => ({ meta: [{ title: 'Coordinators | Talent Hunt 2K26' }, { name: 'description', content: 'Coordinators for Talent Hunt 2K26 at Crescent Institute. Festival information for CSE students.' }, { property: 'og:title', content: 'Coordinators | Talent Hunt 2K26' }, { property: 'og:description', content: 'Coordinators for Talent Hunt 2K26 at Crescent Institute. Festival information for CSE students.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <App view="coordinators"/>,
});
