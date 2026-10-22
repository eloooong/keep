"use client";

import { type ReactNode, useRef } from "react";

// Share the upstream pointer-positioning technique with native vault articles.
export function positionSpotlight(event: React.PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== "mouse" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  element.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  element.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255,255,255,0.12)",
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (
      !ref.current ||
      disabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--mouse-x", `${x}px`);
    ref.current.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`}
      data-disabled={disabled}
      onMouseMove={handleMouseMove}
    >
      <div className="spotlight-content">{children}</div>
      <div
        className="spotlight-light"
        aria-hidden="true"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${spotlightColor}, transparent 40%)`,
        }}
      />
    </div>
  );
}
