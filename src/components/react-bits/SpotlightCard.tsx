"use client";

import { type ReactNode, useRef } from "react";

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255,255,255,0.12)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--mouse-x", `${x}px`);
    ref.current.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <div
      ref={ref}
      className={`group relative ${className}`}
      onMouseMove={handleMouseMove}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${spotlightColor}, transparent 40%)`,
        }}
      />
    </div>
  );
}
