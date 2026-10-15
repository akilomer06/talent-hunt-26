import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: 'Admin & Registration Portal | Talent Hunt 2K26' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: () => <App view="admin" />,
});
