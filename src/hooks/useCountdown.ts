import { useState, useEffect } from 'react';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

export function useCountdown(targetDateIso: string = '2026-10-26T09:00:00+05:30'): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: false,
  });

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDateIso));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDateIso));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateIso]);

  return timeLeft;
}

function calculateTimeLeft(targetIso: string): TimeLeft {
  const difference = new Date(targetIso).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isComplete: false,
  };
}
