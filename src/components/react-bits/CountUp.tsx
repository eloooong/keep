"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const startTime = performance.now();

    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startAs + (end - startAs) * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, startAs]);

  return <span className={className}>{value}</span>;
}
