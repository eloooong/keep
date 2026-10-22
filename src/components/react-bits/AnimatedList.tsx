"use client";

import { Children, type ReactNode, useEffect, useRef } from "react";
import { animate } from "motion/react";

// React Bits AnimatedList concept: keep native controls and stable React keys.
export function AnimatedList({
  children,
  className = "",
  staggerDelay = 25,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(new WeakSet<Element>());
  const items = Children.toArray(children);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controls: ReturnType<typeof animate>[] = [];
    const elements = Array.from(root.children) as HTMLElement[];
    const clear = (element: HTMLElement) => {
      element.style.removeProperty("transform");
      element.style.removeProperty("opacity");
    };
    let entering = 0;
    elements.forEach((element) => {
      if (seen.current.has(element)) return;
      seen.current.add(element);
      if (
        media.matches ||
        entering >= 20 ||
        element.getBoundingClientRect().top > innerHeight
      )
        return;
      const animation = animate(
        element,
        {
          opacity: [1, 1],
          transform: ["translateY(8px)", "translateY(0px)"],
        },
        {
          duration: 0.22,
          delay: Math.min(entering++ * Math.max(0, staggerDelay), 120) / 1000,
          ease: [0.16, 1, 0.3, 1],
        },
      );
      animation.then(() => clear(element));
      controls.push(animation);
    });
    const finish = () => {
      controls.forEach((animation) => animation.stop());
      elements.forEach(clear);
    };
    root.addEventListener("focusin", finish);
    media.addEventListener("change", finish);
    return () => {
      finish();
      root.removeEventListener("focusin", finish);
      media.removeEventListener("change", finish);
    };
  });
  return (
    <div ref={ref} className={`animated-list ${className}`}>
      {items.map((child, i) => (
        <div
          key={
            typeof child === "object" && child !== null && "key" in child
              ? child.key
              : i
          }
          className="animated-list-item"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
