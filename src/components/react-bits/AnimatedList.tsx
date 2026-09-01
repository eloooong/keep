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
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;

    if (prev !== null && count > prev) {
      setRevealedCount(count);
      return;
    }

    const timers = items.map((_, i) =>
      setTimeout(() => setRevealedCount((c) => Math.max(c, i + 1)), i * staggerDelay)
    );
    return () => timers.forEach(clearTimeout);
  }, [count, items, staggerDelay]);

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
