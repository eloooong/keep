"use client";

import { Children, type ReactNode, useEffect, useRef, useState } from "react";

export function AnimatedList({
  children,
  className = "",
  staggerDelay = 40,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const items = Children.toArray(children);
  const count = items.length;

  const [revealedCount, setRevealedCount] = useState(0);
  const prevCountRef = useRef(count);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (!initialisedRef.current) {
      initialisedRef.current = true;
      const timers = items.map((_, i) =>
        setTimeout(() => setRevealedCount((c) => Math.max(c, i + 1)), i * staggerDelay)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [items, count, staggerDelay]);

  useEffect(() => {
    if (initialisedRef.current && count !== prevCountRef.current) {
      prevCountRef.current = count;
      setRevealedCount(count);
    }
  }, [count]);

  return (
    <div className={className}>
      {items.map((child, i) => (
        <div
          key={
            typeof child === "object" && child !== null && "key" in child
              ? child.key
              : i
          }
          className="transition-all duration-300 ease-out"
          style={{
            opacity: i < revealedCount ? 1 : 0,
            transform:
              i < revealedCount
                ? "translateY(0) scale(1)"
                : "translateY(8px) scale(0.97)",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
