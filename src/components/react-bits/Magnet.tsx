"use client";

import { type ReactNode, useRef, useState } from "react";

export function Magnet({
  children,
  className = "",
  magnetStrength = 30,
  active = true,
}: {
  children: ReactNode;
  className?: string;
  magnetStrength?: number;
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!active || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setOffset({
      x: (x / (rect.width / 2)) * magnetStrength,
      y: (y / (rect.height / 2)) * magnetStrength,
    });
  }

  function handleMouseLeave() {
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition:
          offset.x === 0 && offset.y === 0
            ? "transform 0.2s ease-out"
            : "transform 0.08s ease-out",
      }}
    >
      {children}
    </div>
  );
}
