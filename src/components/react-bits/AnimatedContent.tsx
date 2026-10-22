"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { animate } from "motion/react";

// React Bits AnimatedContent concept adapted to Keep's existing Motion runtime.
export function AnimatedContent({
  children,
  className = "",
  distance = 12,
  directionHorizontal = "center",
  directionVertical = "up",
  speed = 0.28,
  blur = 0,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  directionHorizontal?: "left" | "center" | "right";
  directionVertical?: "up" | "center" | "down";
  speed?: number;
  blur?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || media.matches) return;
    const x =
      directionHorizontal === "left"
        ? -distance
        : directionHorizontal === "right"
          ? distance
          : 0;
    const y =
      directionVertical === "up"
        ? distance
        : directionVertical === "down"
          ? -distance
          : 0;
    const controls = animate(
      element,
      {
        opacity: [0.9, 1],
        transform: [`translate(${x}px, ${y}px)`, "translate(0, 0)"],
        filter: [`blur(${blur}px)`, "blur(0px)"],
      },
      { duration: speed, ease: [0.16, 1, 0.3, 1] },
    );
    const clear = () => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      element.style.removeProperty("filter");
    };
    const finish = () => {
      controls.stop();
      clear();
    };
    controls.then(clear);
    element.addEventListener("focusin", finish);
    media.addEventListener("change", finish);
    return () => {
      finish();
      element.removeEventListener("focusin", finish);
      media.removeEventListener("change", finish);
    };
  }, [distance, directionHorizontal, directionVertical, speed, blur]);
  return (
    <div ref={ref} className={`animated-content ${className}`}>
      {children}
    </div>
  );
}
