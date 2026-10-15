import { useEffect } from 'react';
/** Observe explicit reveal targets, including cards added by search/filtering. */
export function useReveal(key: string) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observed = new WeakSet<Element>();
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    }), { threshold: .08 });
    const observe = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal], main section:not(.reveal-skip) > div > *, main .brutal-shadow').forEach(el => {
        if (observed.has(el) || el.closest('.reveal-skip') || el.parentElement?.closest('[data-reveal]')) return;
        observed.add(el);
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        el.classList.add('reveal');
        io.observe(el);
      });
    };
    observe();
    const mutation = new MutationObserver(observe);
    const main = document.querySelector('main');
    if (main) mutation.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mutation.disconnect(); };
  }, [key]);
}
