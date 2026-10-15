import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';

export const Route = createFileRoute('/adminregistration')({
  head: () => ({ meta: [
    { title: 'Registration Team | Talent Hunt 2K26' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
  component: () => <App view="adminregistration" />,
});
