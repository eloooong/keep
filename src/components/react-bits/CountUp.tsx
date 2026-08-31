"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  end,
  duration = 1200,
  className = "",
  startAs = 0,
}: {
  end: number;
  duration?: number;
  className?: string;
  startAs?: number;
}) {
  const [value, setValue] = useState(startAs);
  const prevEndRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevEndRef.current === end) return;
    prevEndRef.current = end;

    const start = startAs;
    const startTime = performance.now();

    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, startAs]);

  return <span className={className}>{value}</span>;
}
