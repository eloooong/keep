"use client";

// Count-mode adaptation of React Bits CountUp by David Haz.
// Source and license: ./README.md and ./LICENSE.react-bits.md.
import { animate, cubicBezier } from "motion/react";
import { useEffect, useRef } from "react";

export function CountUp({
  end,
  duration = 600,
  className = "",
  startAs = 0,
}: {
  end: number;
  duration?: number;
  className?: string;
  startAs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(startAs);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const render = (value: number) => {
      previous.current = value;
      if (ref.current) ref.current.textContent = String(Math.round(value));
    };
    if (media.matches || duration <= 0) {
      render(end);
      return;
    }
    const controls = animate(previous.current, end, {
      duration: duration / 1000,
      ease: cubicBezier(0.33, 1, 0.68, 1),
      onUpdate: render,
      onComplete: () => render(end),
    });
    const finish = () => {
      if (media.matches) {
        controls.stop();
        render(end);
      }
    };
    media.addEventListener("change", finish);
    return () => {
      controls.stop();
      media.removeEventListener("change", finish);
    };
  }, [end, duration]);

  return (
    <span className={className}>
      <span aria-hidden="true" ref={ref}>
        {end}
      </span>
      <span className="sr-only">{end}</span>
    </span>
  );
}
