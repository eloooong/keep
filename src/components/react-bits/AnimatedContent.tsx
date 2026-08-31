"use client";

import { type ReactNode, useEffect, useState } from "react";

export function AnimatedContent({
  children,
  className = "",
  distance = 12,
  directionHorizontal = "center",
  directionVertical = "up",
  speed = 0.4,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  directionHorizontal?: "left" | "center" | "right";
  directionVertical?: "up" | "center" | "down";
  speed?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const translateX =
    directionHorizontal === "left"
      ? -distance
      : directionHorizontal === "right"
        ? distance
        : 0;
  const translateY =
    directionVertical === "up"
      ? distance
      : directionVertical === "down"
        ? -distance
        : 0;

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(0, 0)"
          : `translate(${translateX}px, ${translateY}px)`,
        transition: `opacity ${speed}s ease-out, transform ${speed}s ease-out`,
      }}
    >
      {children}
    </div>
  );
}
