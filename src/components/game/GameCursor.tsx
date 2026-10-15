import { useEffect, useRef } from 'react';

export function GameCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!media.matches) return;
    const el = cursor.current;
    if (!el) return;
    let x = -100, y = -100, tx = -100, ty = -100, frame = 0;
    const move = (event: PointerEvent) => {
      tx = event.clientX; ty = event.clientY;
      el.classList.add('is-visible');
      el.classList.toggle('is-target', event.target instanceof Element && Boolean(event.target.closest('button, a, input')));
    };
    const hide = () => el.classList.remove('is-visible');
    const click = () => { el.classList.remove('is-fired'); void el.offsetWidth; el.classList.add('is-fired'); };
    const animate = () => {
      x += (tx - x) * .2; y += (ty - y) * .2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(animate);
    };
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', hide);
    window.addEventListener('pointerdown', click);
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', hide); window.removeEventListener('pointerdown', click); };
  }, []);
  return <div ref={cursor} className="gm-cursor" aria-hidden="true"><span/><i/><b/></div>;
}
