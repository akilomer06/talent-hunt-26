import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';
export const Route = createFileRoute('/about')({
 head: () => ({ meta: [{ title: 'About | Talent Hunt 2K26' }, { name: 'description', content: 'About for Talent Hunt 2K26 at Crescent Institute. Festival information for CSE students.' }, { property: 'og:title', content: 'About | Talent Hunt 2K26' }, { property: 'og:description', content: 'About for Talent Hunt 2K26 at Crescent Institute. Festival information for CSE students.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <App view="about"/>,
});
