import { useEffect, useState } from 'react';

const START = new Date('2026-10-26T09:00:00+05:30').getTime();
const END = new Date('2026-10-26T17:00:00+05:30').getTime();

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now !== null && now >= END) return <p className="countdown-state" aria-live="off">Thank you for joining Talent Hunt 2K26</p>;
  if (now !== null && now >= START) return <p className="countdown-state" aria-live="off">Event is live today</p>;
  const diff = now === null ? null : START - now;
  const val = (n: number) => (diff === null ? '--' : String(n).padStart(2, '0'));
  const d = diff ?? 0;
  const units = [
    { label: 'Days', value: val(Math.floor(d / 86400000)) },
    { label: 'Hours', value: val(Math.floor(d / 3600000) % 24) },
    { label: 'Minutes', value: val(Math.floor(d / 60000) % 60) },
    { label: 'Seconds', value: val(Math.floor(d / 1000) % 60) },
  ];
  return <div className="countdown-digits" aria-live="off" aria-label="Time until the event starts">{units.map(u => <div key={u.label}><strong>{u.value}</strong><span>{u.label}</span></div>)}</div>;
}
